export type TipoEvento = "academico" | "deportivo" | "cultural" | "administrativo" | "otro";

export interface Evento {
    id: number;
    espacio_id: number | null;
    titulo: string;
    descripcion: string | null;
    fecha_inicio: string;
    fecha_fin: string | null;
    tipo: TipoEvento;
    foto_url: string | null;
    url_registro: string | null;
    activo: boolean;
    creado_en: string;
}

export type EventoCreate = Omit<Evento, "id" | "creado_en">;
export type EventoUpdate = Partial<EventoCreate>;
