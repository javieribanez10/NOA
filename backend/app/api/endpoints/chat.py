import asyncio
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
import tiktoken
import time
import re
import random

from app.database.models.user import User
from app.database.models.session import get_db
from app.api.endpoints.users import get_current_user
from app.api.endpoints.noa import get_noa_config

# Importamos la función para enviar mensajes vía Responses API
from app.services.ML.embeddings.openai.responses_session import send_message

router = APIRouter()

# Modelos de request/response para el chat
class ChatRequest(BaseModel):
    message: str
    selected_file_ids: Optional[List[int]] = None

class ChatResponse(BaseModel):
    response: str

# Estructura para mantener el seguimiento de las conversaciones por usuario
class ConversationTracker:
    def __init__(self):
        self.response_id: Optional[str] = None
        self.message_count: int = 0
        self.last_reset: float = time.time()
        self.last_request_time: float = 0

# Diccionario global para mantener el seguimiento de conversaciones por usuario
active_conversations: Dict[int, ConversationTracker] = {}

# Tokenizer para contar tokens
def count_tokens(text: str, model: str = "gpt-4o") -> int:
    try:
        encoder = tiktoken.encoding_for_model(model)
        return len(encoder.encode(text))
    except Exception:
        # Estimación aproximada si tiktoken falla
        return len(text.split()) * 1.3

# Función para truncar texto a un número máximo de tokens
def truncate_to_token_limit(text: str, max_tokens: int) -> str:
    try:
        encoder = tiktoken.encoding_for_model("gpt-4o")
        tokens = encoder.encode(text)
        
        if len(tokens) <= max_tokens:
            return text
        
        truncated_tokens = tokens[:max_tokens]
        return encoder.decode(truncated_tokens)
    except Exception:
        # Estimación muy aproximada si falla
        words = text.split()
        estimated_words = int(max_tokens / 1.3)
        return " ".join(words[:estimated_words]) + " [texto truncado...]"

# Función para extraer el tiempo de espera recomendado de un mensaje de error
def extract_retry_after(error_message: str) -> float:
    match = re.search(r'Please try again in (\d+\.\d+)s', error_message)
    if match:
        return float(match.group(1))
    return 1.0  # Valor por defecto si no se encuentra

async def send_message_with_retry(
    message, 
    previous_response_id, 
    tools, 
    temperature, 
    max_output_tokens, 
    top_p, 
    store,
    max_retries=3
):
    retries = 0
    backoff_time = 1  # Tiempo inicial de espera en segundos
    
    while retries <= max_retries:
        try:
            return send_message(
                message=message,
                previous_response_id=previous_response_id,
                tools=tools,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                top_p=top_p,
                store=store
            )
        except Exception as e:
            error_str = str(e)
            
            # Si es un error de formato de solicitud, debemos detener inmediatamente
            if "invalid_request_error" in error_str:
                raise  # No hay punto en reintentar errores de formato
            
            # Si es un error de límite de velocidad de tokens
            if "rate_limit_exceeded" in error_str and "tokens" in error_str:
                retries += 1
                
                if retries > max_retries:
                    raise  # Reenvía la excepción si se agotaron los reintentos
                
                # Extrae el tiempo de espera sugerido o usa el tiempo de retroceso calculado
                wait_time = extract_retry_after(error_str)
                wait_time = max(wait_time, backoff_time)
                
                # Añadir un poco de aleatoriedad para evitar que múltiples clientes se sincronicen
                jitter = random.uniform(0, 0.1 * wait_time)
                total_wait = wait_time + jitter
                
                # Espera antes de reintentar
                await asyncio.sleep(total_wait)
                
                # Incrementar el tiempo de espera para el próximo reintento (retroceso exponencial)
                backoff_time *= 2
            else:
                # Para otros tipos de errores, reenvía la excepción inmediatamente
                raise

async def track_token_usage(user_id: int, input_tokens: int, output_tokens: int, model: str = "gpt-4o"):
    """
    Función para rastrear el uso de tokens (versión simple)
    En un sistema completo, esto guardaría en DB o Redis
    """
    try:
        # Aquí se implementaría la lógica real de registro
        total_tokens = input_tokens + output_tokens
        print(f"[Token Usage] User ID: {user_id}, Input: {input_tokens}, Output: {output_tokens}, Total: {total_tokens}, Model: {model}")
        # En un sistema real, aquí guardaríamos en una DB
    except Exception as e:
        print(f"Error tracking token usage: {e}")

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    try:
        user_id = current_user.id
        
        # Inicializar o recuperar el tracker de conversación para este usuario
        if user_id not in active_conversations:
            active_conversations[user_id] = ConversationTracker()
        
        conversation = active_conversations[user_id]
        
        # Verificar si debemos reiniciar la conversación (después de 10 mensajes)
        if conversation.message_count >= 10:
            conversation.response_id = None
            conversation.message_count = 0
            conversation.last_reset = time.time()
            print(f"Reiniciando conversación para usuario {user_id} después de 10 mensajes")
        
        # Incrementar el contador de mensajes
        conversation.message_count += 1
        
        # 1. Recuperar la configuración NOA del usuario desde la BD
        config = get_noa_config(db=db, current_user=current_user)
        
        # 2. Construir el prompt sistema a partir de la configuración (con límite de tokens)
        system_prompt_full = (
            f"Instrucción: {config.prompt}\n"
            f"Personalidad: {config.personality}\n"
            f"Objetivo: {config.objective}\n"
            "Utiliza el siguiente contexto cuando sea necesario para responder de forma precisa."
        )
        
        # Limitar el sistema a un máximo de 1500 tokens para dejar espacio para otras partes
        system_prompt = truncate_to_token_limit(system_prompt_full, 1500)
        
        # Limitar el mensaje del usuario a un máximo de 2000 tokens
        user_message = truncate_to_token_limit(chat_req.message, 2000)
        
        # 3. Preparar el payload para Responses API (con límites de tokens)
        # AQUÍ ESTÁ EL CAMBIO IMPORTANTE: Formateamos correctamente la entrada según la documentación de OpenAI
        input_payload = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
        
        # 4. Preparar tools para Responses API (incluyendo file_search siempre)
        tools = [{
            "type": "file_search",
            "vector_store_ids": ["vs_67da2a9a90b4819194ed77849ac443db"],  # Tu vector store ID
            "max_num_results": 3  # Limitamos a 3 resultados para reducir uso de tokens
        }]
        
        # 5. Obtener el previous_response_id si existe y si no hemos reiniciado la conversación
        # Para gestionar mejor los tokens, solo usamos el previous_response_id para los primeros intercambios
        # Después de cierto punto, descartamos el historial para evitar acumulación de tokens
        if conversation.message_count <= 5:
            previous_response_id = conversation.response_id
        else:
            previous_response_id = None
        
        # Registra el tiempo actual antes de la solicitud
        now = time.time()
        
        # Verifica si han pasado menos de 2 segundos desde la última solicitud
        # y maneja el espaciado de las solicitudes si es necesario
        time_since_last_request = now - conversation.last_request_time
        if conversation.last_request_time > 0 and time_since_last_request < 2.0:
            # Espera un poco para reducir la velocidad de las solicitudes
            await asyncio.sleep(max(0, 2.0 - time_since_last_request))
        
        # Actualiza el tiempo de la última solicitud
        conversation.last_request_time = time.time()
        
        # 6. Enviar la consulta a Responses API con reintentos
        response = await send_message_with_retry(
            message=input_payload,
            previous_response_id=previous_response_id,
            tools=tools,
            temperature=config.temperature,
            max_output_tokens=1024,  # Reducimos para mantenernos bajo límites
            top_p=1,
            store=True
        )
        
        # 7. Actualizar el último response_id
        conversation.response_id = response.id
        
        # 8. Obtener el texto de respuesta
        respuesta = response.output_text
        
        # 9. Tracking de tokens (versión simple)
        input_tokens = count_tokens(system_prompt) + count_tokens(user_message)
        output_tokens = count_tokens(respuesta)
        background_tasks.add_task(
            track_token_usage,
            user_id=current_user.id,
            input_tokens=input_tokens,
            output_tokens=output_tokens
        )
        
    except Exception as e:
        # Log detallado del error para depuración
        import logging
        logging.error(f"Error en chat_endpoint: {str(e)}")
        
        # Si es un error de límite de tokens, reiniciar la conversación automáticamente
        if "rate_limit_exceeded" in str(e) and "tokens" in str(e):
            if user_id in active_conversations:
                active_conversations[user_id].response_id = None
                active_conversations[user_id].message_count = 0
                
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Se ha excedido el límite de tokens. La conversación se ha reiniciado automáticamente. Por favor, intente de nuevo en unos momentos."
            )
        elif "invalid_request_error" in str(e):
            # Error de formato de solicitud
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error en el formato de la solicitud: {str(e)}"
            )
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
    return ChatResponse(response=respuesta)

@router.post("/new", response_model=ChatResponse)
async def new_chat_session(
    current_user: User = Depends(get_current_user)
):
    """
    Inicia una nueva sesión de chat para el usuario actual,
    reiniciando completamente el historial y los contadores.
    """
    user_id = current_user.id
    
    # Reiniciar completamente la conversación
    if user_id in active_conversations:
        active_conversations[user_id] = ConversationTracker()
    else:
        active_conversations[user_id] = ConversationTracker()
    
    return ChatResponse(response="Nueva sesión de chat iniciada. ¿En qué puedo ayudarte hoy?")