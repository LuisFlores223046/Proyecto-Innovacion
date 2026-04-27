"""Rutas de autenticación."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_admin
from app.models.administrador import Administrador
from app.schemas.administrador import AdminCreate, AdminOut, LoginIn, TokenOut
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenOut)
def login(datos: LoginIn, db: Session = Depends(get_db)):
    """
    Verifica credenciales y genera un token JWT de sesión.

    Args:
        datos: Esquema con nombre de usuario y contraseña.
        db: Sesión de base de datos inyectada.

    Returns:
        TokenOut: Objeto conteniendo el access_token generado.

    Raises:
        HTTPException: 401 si las credenciales son inválidas.
        HTTPException: 403 si la cuenta está bloqueada por intentos fallidos.
    """
    admin = db.query(Administrador).filter(Administrador.username == datos.username).first()

    if not admin or not admin.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Verificar bloqueo
    if admin.bloqueado_hasta and admin.bloqueado_hasta > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta bloqueada temporalmente por múltiples intentos fallidos",
        )

    if not verify_password(datos.password, admin.password_hash):
        admin.intentos_fallidos += 1
        if admin.intentos_fallidos >= settings.MAX_LOGIN_ATTEMPTS:
            from datetime import timedelta
            admin.bloqueado_hasta = datetime.now(timezone.utc) + timedelta(
                minutes=settings.LOCKOUT_MINUTES
            )
            admin.intentos_fallidos = 0
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Login exitoso — resetear intentos
    admin.intentos_fallidos = 0
    admin.bloqueado_hasta = None
    db.commit()

    token = create_access_token({"sub": admin.username})
    return TokenOut(access_token=token)


@router.post("/admin", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
def crear_admin(
    datos: AdminCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Registra un nuevo administrador en el sistema.

    Args:
        datos: Información del nuevo administrador.
        db: Sesión de base de datos.
        _: Dependencia que asegura que solo un admin actual cree otros.

    Returns:
        Administrador: El objeto administrador creado.

    Raises:
        HTTPException: 409 si el username o email ya existen.
    """
    if db.query(Administrador).filter(Administrador.username == datos.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario ya existe",
        )
    if db.query(Administrador).filter(Administrador.email == datos.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )

    admin = Administrador(
        username=datos.username,
        email=datos.email,
        password_hash=hash_password(datos.password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.get("/admin", response_model=list[AdminOut])
def listar_admins(
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Obtiene la lista completa de administradores registrados."""
    return db.query(Administrador).order_by(Administrador.id).all()


@router.get("/me", response_model=AdminOut)
def perfil(admin: Administrador = Depends(get_current_admin)):
    """Obtiene la información del administrador actualmente autenticado."""
    return admin


@router.delete("/admin/{admin_id}", response_model=AdminOut)
def eliminar_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    admin_actual: Administrador = Depends(get_current_admin),
):
    """
    Elimina permanentemente un administrador del sistema.

    Args:
        admin_id: ID del administrador a eliminar.
        db: Sesión de base de datos.
        admin_actual: Instancia del admin que realiza la petición.

    Returns:
        Administrador: El objeto eliminado.

    Raises:
        HTTPException: 400 si se intenta eliminar a sí mismo o al último admin.
        HTTPException: 404 si el admin no existe.
    """
    if admin_actual.id == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta",
        )

    total_admins = db.query(Administrador).filter(Administrador.activo == True).count()
    if total_admins <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe existir al menos un administrador activo",
        )

    admin = db.query(Administrador).filter(Administrador.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Administrador no encontrado")

    db.delete(admin)
    db.commit()
    return admin
