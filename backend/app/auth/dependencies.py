from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt import decode_token
from app.models.administrador import Administrador

bearer_scheme = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Administrador:
    """
    Valida el token JWT y devuelve el administrador autenticado.

    Args:
        credentials: Credenciales extraídas del encabezado Authorization.
        db: Sesión de la base de datos.

    Returns:
        Administrador: Instancia del administrador que posee el token.

    Raises:
        HTTPException: 401 si el token es inválido, expiró, está malformado
            o si el administrador no existe o está inactivo.
    """
    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username: str | None = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado",
        )

    admin = db.query(Administrador).filter(Administrador.username == username).first()
    if admin is None or not admin.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Administrador no encontrado o inactivo",
        )

    # Verificar si la cuenta está bloqueada temporalmente por intentos fallidos
    if admin.bloqueado_hasta and admin.bloqueado_hasta > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta bloqueada temporalmente. Intente más tarde.",
        )

    return admin
