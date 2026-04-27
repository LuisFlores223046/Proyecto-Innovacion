from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Genera un hash seguro a partir de una cadena de texto plano."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Compara una contraseña en plano con su hash para verificar validez."""
    return pwd_context.verify(plain, hashed)
