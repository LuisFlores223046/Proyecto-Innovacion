import type { Edificio } from "./edificio";
import type { Evento } from "./evento";

export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color_hex: string;
}

export interface Horario {
  id: number;
  espacio_id: number;
  dia_semana: number; // 0=lunes … 6=domingo
  hora_apertura: string;
  hora_cierre: string;
}

export interface Contacto {
  id: number;
  espacio_id: number;
  tipo: "telefono" | "correo" | "extension";
  valor: string;
}

export interface Servicio {
  id: number;
  espacio_id: number;
  descripcion: string;
}

export interface Foto {
  id: number;
  espacio_id: number;
  descripcion: string | null;
  es_principal: boolean;
  orden: number;
  url: string;
  subida_en: string;
}

export interface Espacio {
  id: number;
  codigo: string;
  nombre: string;
  categoria_id: number | null;
  piso_id: number | null;
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
  notas: string | null;
  creado_en: string;
  actualizado_en: string | null;
  categoria: Categoria | null;
  edificio: Edificio | null;
}

/** Detalle completo con todas las relaciones anidadas */
export interface EspacioCompleto extends Espacio {
  horarios: Horario[];
  contactos: Contacto[];
  servicios: Servicio[];
  fotos: Foto[];
  eventos: Evento[];
}
