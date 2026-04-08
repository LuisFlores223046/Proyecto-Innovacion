export interface Edificio {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  latitud: number | null;
  longitud: number | null;
  foto_url: string | null;
}
