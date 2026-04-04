from app.schemas.categoria import CategoriaOut, CategoriaCreate, CategoriaUpdate
from app.schemas.edificio import EdificioOut, EdificioCreate, EdificioUpdate
from app.schemas.piso import PisoOut, PisoCreate
from app.schemas.espacio import EspacioOut, EspacioCreate, EspacioUpdate, EspacioCompleto
from app.schemas.horario import HorarioOut, HorarioCreate, HorarioUpdate
from app.schemas.contacto import ContactoOut, ContactoCreate
from app.schemas.servicio_espacio import ServicioOut, ServicioCreate
from app.schemas.foto_espacio import FotoOut, FotoCreate, FotoUpdate
from app.schemas.evento import EventoOut, EventoCreate, EventoUpdate
from app.schemas.administrador import AdminOut, AdminCreate, TokenOut, LoginIn

__all__ = [
    "CategoriaOut", "CategoriaCreate", "CategoriaUpdate",
    "EdificioOut", "EdificioCreate", "EdificioUpdate",
    "PisoOut", "PisoCreate",
    "EspacioOut", "EspacioCreate", "EspacioUpdate", "EspacioCompleto",
    "HorarioOut", "HorarioCreate", "HorarioUpdate",
    "ContactoOut", "ContactoCreate",
    "ServicioOut", "ServicioCreate",
    "FotoOut", "FotoCreate", "FotoUpdate",
    "EventoOut", "EventoCreate", "EventoUpdate",
    "AdminOut", "AdminCreate", "TokenOut", "LoginIn",
]
