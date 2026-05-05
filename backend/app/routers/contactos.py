"""Rutas para contactos de espacios."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.contacto import Contacto
from app.models.administrador import Administrador
from app.schemas.contacto import ContactoCreate, ContactoOut

router = APIRouter(prefix="/contactos", tags=["Contactos"])


@router.post("", response_model=ContactoOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: ContactoCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """Crea un registro de contacto (teléfono, red social, etc.) para un espacio."""
    contacto = Contacto(**datos.model_dump())
    db.add(contacto)
    db.commit()
    db.refresh(contacto)
    return contacto


@router.delete("/{contacto_id}", response_model=ContactoOut)
def eliminar(
    contacto_id: int,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Elimina un contacto específico de la base de datos.

    Args:
        contacto_id: ID del contacto a remover.
        db: Sesión de base de datos.

    Returns:
        Contacto: Los datos del contacto eliminado.
    """
    contacto = db.query(Contacto).filter(Contacto.id == contacto_id).first()
    if not contacto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contacto no encontrado")
    db.delete(contacto)
    db.commit()
    return contacto
