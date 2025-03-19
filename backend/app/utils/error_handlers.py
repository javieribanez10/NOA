from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse

async def http_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

class CustomException(Exception):
    def __init__(self, message: str, code: int = 400):
        self.message = message
        self.code = code