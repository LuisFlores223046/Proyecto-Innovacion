"""Rutas para categorías."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.categoria import Categoria
from app.models.administrador import Administrador
from app.schemas.categoria import CategoriaCreate, CategoriaOut, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.get("", response_model=list[CategoriaOut])
def listar(db: Session = Depends(get_db)):
    """Lista todas las categorías de espacios disponibles en orden alfabético."""
    return db.query(Categoria).order_by(Categoria.nombre).all()


@router.post("", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
def crear(
    datos: CategoriaCreate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Crea una nueva categoría para clasificar espacios.

    Args:
        datos: Datos de la categoría (nombre, icono, etc).
        db: Sesión de base de datos.
        _: Valida rol de administrador.

    Returns:
        Categoria: La categoría creada.

    Raises:
        HTTPException: 409 si el nombre de la categoría ya está en uso.
    """
    if db.query(Categoria).filter(Categoria.nombre == datos.nombre).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La categoría ya existe")
    cat = Categoria(**datos.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/{cat_id}", response_model=CategoriaOut)
def actualizar(
    cat_id: int,
    datos: CategoriaUpdate,
    db: Session = Depends(get_db),
    _: Administrador = Depends(get_current_admin),
):
    """
    Modifica parcialmente una categoría existente.

    Args:
        cat_id: Identificador único de la categoría.
        datos: Campos a actualizar.
        db: Sesión de base de datos.

    Returns:
        Categoria: La categoría actualizada.
    """
    cat = db.query(Categoria).filter(Categoria.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(cat, campo, valor)
    db.commit()
    db.refresh(cat)
    return cat
