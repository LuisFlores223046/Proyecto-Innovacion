import type { Edificio } from "../types/edificio";
import type { Espacio, Categoria, EspacioCompleto } from "../types/espacio";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export async function fetchEdificios(): Promise<Edificio[]> {
  const res = await fetch(`${API_BASE}/edificios`);
  if (!res.ok) throw new Error("Error al obtener edificios");
  return res.json();
}

export async function fetchEspaciosPorEdificio(edificioId: number): Promise<Espacio[]> {
  const res = await fetch(`${API_BASE}/espacios?edificio_id=${edificioId}`);
  if (!res.ok) throw new Error("Error al obtener espacios del edificio");
  return res.json();
}

export async function fetchCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_BASE}/categorias`);
  if (!res.ok) throw new Error("Error al obtener categorias");
  return res.json();
}

export async function fetchEspaciosPorCategoria(categoriaId: number): Promise<Espacio[]> {
  const res = await fetch(`${API_BASE}/espacios?categoria_id=${categoriaId}`);
  if (!res.ok) throw new Error("Error al obtener espacios por categoria");
  return res.json();
}

export async function fetchEspacioDetalle(espacioId: number): Promise<EspacioCompleto> {
  const res = await fetch(`${API_BASE}/espacios/${espacioId}`);
  if (!res.ok) throw new Error("Error al obtener detalle del espacio");
  return res.json();
}