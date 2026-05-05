export interface Piso {
  id: number;
  edificio_id: number;
  numero: string;
}

export interface Edificio {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  foto_url: string | null;
  pisos?: Piso[];
}
