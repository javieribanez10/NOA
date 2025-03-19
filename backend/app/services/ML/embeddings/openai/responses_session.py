# responses_session.py
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

client = OpenAI()  # Se asume que OPENAI_API_KEY está configurado en el entorno

def send_message(message, previous_response_id=None, tools=None, **kwargs):
    """
    Envía un mensaje utilizando la Responses API.
    
    :param message: El input que puede ser un string o una lista de objetos (como en el ejemplo).
    :param previous_response_id: ID de la respuesta anterior para mantener el contexto.
    :param tools: Lista de herramientas a utilizar (por ejemplo, file_search, web_search_preview).
    :param kwargs: Argumentos adicionales (e.g., temperature, max_output_tokens, top_p, store).
    :return: Objeto de respuesta de la API.
    """
    payload = {
        "model": kwargs.pop("model", "gpt-4o"),
        "input": message,
    }
    if previous_response_id:
        payload["previous_response_id"] = previous_response_id
    if tools:
        payload["tools"] = tools
    # Se añaden el resto de parámetros (como temperature, max_output_tokens, etc.)
    payload.update(kwargs)
    
    try:
        response = client.responses.create(**payload)
        logger.info(f"Mensaje enviado correctamente. Response ID: {response.id}")
        return response
    except Exception as e:
        logger.error(f"Error en send_message: {e}")
        raise
