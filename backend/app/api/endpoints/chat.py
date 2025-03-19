import asyncio
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List

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

# Diccionario global para mantener el último response_id por usuario
active_response_ids = {}

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(
    chat_req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    try:
        # 1. Recuperar la configuración NOA del usuario desde la BD
        config = get_noa_config(db=db, current_user=current_user)

        # 2. Construir el prompt sistema a partir de la configuración
        system_prompt = (
            f"Instrucción: {config.prompt}\n"
            f"Personalidad: {config.personality}\n"
            f"Objetivo: {config.objective}\n"
            "Utiliza el siguiente contexto cuando sea necesario para responder de forma precisa."
        )

        # 3. Preparar el payload para Responses API
        input_payload = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "input_text",
                        "text": system_prompt
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": chat_req.message
                    }
                ]
            }
        ]

        # 4. Preparar tools para Responses API (incluyendo file_search siempre)
        tools = [
            {
                "type": "file_search",
                "vector_store_ids": ["vs_67da2a9a90b4819194ed77849ac443db"]  # Tu vector store ID
            }
        ]

        # 5. Obtener el previous_response_id si existe
        previous_response_id = active_response_ids.get(current_user.id)

        # 6. Enviar la consulta a Responses API
        response = send_message(
            message=input_payload,
            previous_response_id=previous_response_id,
            tools=tools,
            temperature=config.temperature,
            max_output_tokens=2048,
            top_p=1,
            store=True
        )

        # 7. Actualizar el último response_id
        active_response_ids[current_user.id] = response.id

        # 8. Obtener el texto de respuesta
        respuesta = response.output_text

        # 9. Si se implementa tracking de tokens, hacerlo aquí con background_tasks
        # (similar a como se hace en el segundo script)

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
    return ChatResponse(response=respuesta)