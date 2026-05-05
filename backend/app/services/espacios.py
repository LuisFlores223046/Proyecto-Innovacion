"""Lógica de negocio para espacios."""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, text
from fastapi import HTTPException, status
from app.models.espacio import Espacio
from app.models.horario import Horario
from app.schemas.espacio import EspacioCreate, EspacioUpdate


def _base_query(db: Session):
    """Prepara una consulta con carga optimizada de todas las relaciones."""
    return (
        db.query(Espacio)
        .options(
            joinedload(Espacio.categoria),
            joinedload(Espacio.piso),
            joinedload(Espacio.horarios),
            joinedload(Espacio.contactos),
            joinedload(Espacio.servicios),
            joinedload(Espacio.fotos),
            joinedload(Espacio.eventos),
        )
    )


def listar_espacios(
    db: Session,
    categoria_id: int | None = None,
    edificio_id: int | None = None,
    activo: bool | None = True,
) -> list[Espacio]:
    """
    Filtra y devuelve una lista de espacios según criterios.

    Args:
        db: Sesión activa de base de datos.
        categoria_id: ID de categoría para filtrar.
        edificio_id: ID de edificio para filtrar.
        activo: Estado de activación del espacio.

    Returns:
        List[Espacio]: Lista de espacios que coinciden con los filtros.
    """
    q = _base_query(db)
    if activo is not None:
        q = q.filter(Espacio.activo == activo)
    if categoria_id is not None:
        q = q.filter(Espacio.categoria_id == categoria_id)
    if edificio_id is not None:
        from app.models.piso import Piso
        q = q.join(Piso, Espacio.piso_id == Piso.id).filter(Piso.edificio_id == edificio_id)
    return q.all()


def buscar_espacios(db: Session, q: str, limite: int = 20) -> list[Espacio]:
    """
    Realiza una búsqueda de espacios activos basada en una cadena de texto.

    La búsqueda es insensible a mayúsculas y minúsculas (ilike) y compara el
    término contra el nombre, código y notas del espacio.

    Args:
        db: Sesión de la base de datos.
        q: Término de búsqueda proporcionado por el usuario.
        limite: Número máximo de resultados a devolver (por defecto 20).

    Returns:
        List[Espacio]: Lista de espacios que coinciden con los criterios.
    """
    termino = f"%{q}%"
    return (
        _base_query(db)
        .filter(
            Espacio.activo == True,
            or_(
                Espacio.nombre.ilike(termino),
                Espacio.codigo.ilike(termino),
                Espacio.notas.ilike(termino),
            ),
        )
        .limit(limite)
        .all()
    )


_ZONA_JUAREZ = ZoneInfo("America/Ciudad_Juarez")


def espacios_abiertos_ahora(db: Session) -> list[Espacio]:
    """
    Consulta los espacios que se encuentran operativos en el momento actual.

    Utiliza la hora local de Ciudad Juárez para comparar contra los horarios
    almacenados en BD (que son hora local, sin zona).

    Args:
        db: Sesión de la base de datos.

    Returns:
        List[Espacio]: Espacios activos cuyo horario coincide con el tiempo actual.
    """
    ahora = datetime.now(_ZONA_JUAREZ)
    dia_actual = ahora.weekday()  # 0=lunes … 6=domingo
    hora_actual = ahora.time()

    ids_abiertos = (
        db.query(Horario.espacio_id)
        .filter(
            Horario.dia_semana == dia_actual,
            Horario.hora_apertura <= hora_actual,
            Horario.hora_cierre >= hora_actual,
        )
        .subquery()
    )

    return (
        _base_query(db)
        .filter(Espacio.activo == True, Espacio.id.in_(ids_abiertos))
        .all()
    )


def espacios_cercanos(db: Session, lat: float, lon: float, radio: float = 200.0) -> list[Espacio]:
    """Devuelve espacios activos dentro de `radio` metros usando la fórmula de Haversine en SQL."""
    query = text(
        """
        SELECT id FROM espacios
        WHERE activo = TRUE
          AND latitud IS NOT NULL
          AND longitud IS NOT NULL
          AND (
            6371000 * acos(
              LEAST(1.0,
                cos(radians(:lat)) * cos(radians(latitud::float))
                * cos(radians(longitud::float) - radians(:lon))
                + sin(radians(:lat)) * sin(radians(latitud::float))
              )
            )
          ) <= :radio
        """
    )
    rows = db.execute(query, {"lat": lat, "lon": lon, "radio": radio}).fetchall()
    ids = [r[0] for r in rows]
    if not ids:
        return []
    return _base_query(db).filter(Espacio.id.in_(ids)).all()


def obtener_espacio(db: Session, espacio_id: int) -> Espacio:
    """Recupera un espacio por su ID con todas sus relaciones."""
    espacio = _base_query(db).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espacio no encontrado")
    return espacio


def crear_espacio(db: Session, datos: EspacioCreate) -> Espacio:
    """Crea un nuevo registro de espacio en la base de datos."""
    espacio = Espacio(**datos.model_dump())
    db.add(espacio)
    db.commit()
    db.refresh(espacio)
    return obtener_espacio(db, espacio.id)


def actualizar_espacio(db: Session, espacio_id: int, datos: EspacioUpdate) -> Espacio:
    """Actualiza campos específicos de un espacio existente."""
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espacio no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(espacio, campo, valor)
    db.commit()
    return obtener_espacio(db, espacio_id)


def desactivar_espacio(db: Session, espacio_id: int) -> Espacio:
    """Borrado lógico — nunca físico."""
    espacio = db.query(Espacio).filter(Espacio.id == espacio_id).first()
    if not espacio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Espacio no encontrado")
    espacio.activo = False
    db.commit()
    db.refresh(espacio)
    return espacio
