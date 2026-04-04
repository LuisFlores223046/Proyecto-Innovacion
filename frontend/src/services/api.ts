const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export async function fetchEdificios() {
  const res = await fetch(`${API_BASE}/edificios`);
  if (!res.ok) throw new Error("Error al obtener edificios");
  return res.json();
}

export async function fetchEspaciosPorEdificio(edificioId: number) {
  const res = await fetch(`${API_BASE}/espacios?edificio_id=${edificioId}`);
  if (!res.ok) throw new Error("Error al obtener espacios del edificio");
  return res.json();
}
