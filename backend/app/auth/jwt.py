from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config import settings


def create_access_token(data: dict) -> str:
    """
    Crea un token JWT firmado.

    Args:
        data: Diccionario con los datos (payload) a incluir en el token.

    Returns:
        str: El token JWT codificado.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    """
    Decodifica y valida un token JWT.

    Args:
        token: Cadena de texto con el JWT.

    Returns:
        Optional[dict]: El payload decodificado o None si el token es inválido.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
