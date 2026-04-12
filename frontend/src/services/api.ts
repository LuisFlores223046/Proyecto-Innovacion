import type { Edificio, Piso } from "../types/edificio";
import type { Espacio, Categoria, EspacioCompleto, Contacto, Servicio, Horario, Foto } from "../types/espacio";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("access_token");

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.method && options.method !== "GET") {
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
    toast.error(`Error de red: no se pudo contactar al servidor (${errorMsg})`);
    throw error;
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorDetail = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        // En caso de que sea un error de validación de Pydantic
        errorDetail = errorData.detail[0].msg;
      }
    } catch (e) {
      // No era JSON válido, nos quedamos con el statusText
    }

    toast.error(`Error: ${errorDetail || "Ocurrió un error inesperado"}`);
    throw new Error(`Error en la petición: ${errorDetail}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}

export const fetchEdificios = () => fetchClient<Edificio[]>("/edificios");
export const fetchEdificiosCompleto = () => fetchClient<Edificio[]>("/edificios/completo");

export const agregarEdificio = (datosNuevos: Omit<Edificio, "id">) =>
  fetchClient<Edificio>("/edificios", {
    method: "POST",
    body: JSON.stringify(datosNuevos)
  });

export const editarEdificio = (edificioId: number, datosNuevos: Partial<Edificio>) =>
  fetchClient<Edificio>(`/edificios/${edificioId}`, {
    method: "PATCH",
    body: JSON.stringify(datosNuevos)
  });

export const eliminarEdificio = (edificioId: number) => fetchClient<void>(`/edificios/${edificioId}`, { method: "DELETE" });

export const subirFotoEdificio = (edificioId: number, archivo: File) => {
  const data = new FormData();
  data.append("file", archivo);
  return fetchClient<Edificio>(`/edificios/${edificioId}/foto`, {
    method: "POST",
    body: data,
  });
};

export const eliminarFotoEdificio = (edificioId: number) =>
  fetchClient<Edificio>(`/edificios/${edificioId}/foto`, { method: "DELETE" });

export const fetchPisos = (edificioId: number) => fetchClient<Piso[]>(`/edificios/${edificioId}/pisos`);

export const agregarPiso = (datos: { edificio_id: number, numero: string }) =>
  fetchClient<Piso>("/pisos", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const fetchEspaciosPorEdificio = (edificioId: number) => fetchClient<Espacio[]>(`/espacios?edificio_id=${edificioId}`);

export const fetchCategorias = () => fetchClient<Categoria[]>("/categorias");

export const fetchEspaciosPorCategoria = (categoriaId: number) => fetchClient<Espacio[]>(`/espacios?categoria_id=${categoriaId}`);

export const fetchEspacioDetalle = (espacioId: number) => fetchClient<EspacioCompleto>(`/espacios/${espacioId}`);

export async function fetchTodosLosEspacios(excludedCategories: string[] = []): Promise<Espacio[]> {
  const data = await fetchClient<Espacio[]>("/espacios");
  if (excludedCategories.length === 0) return data;
  return data.filter(esp => !esp.categoria || !excludedCategories.includes(esp.categoria.nombre));
}

export const fetchBuscarEspacios = (query: string) => fetchClient<Espacio[]>(`/espacios/buscar/${encodeURIComponent(query)}`);

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const loginAdmin = (credenciales: { username: string, password: string }) => fetchClient<LoginResponse>("/auth/login", {
  method: "POST",
  body: JSON.stringify(credenciales),
});

export interface MeResponse {
  id: number,
  username: string,
  email: string,
  activo: boolean,
  creado_en: string
}

export const getMe = () => fetchClient<MeResponse>("/auth/me");

export const editarEspacio = (espacioId: number, datosNuevos: Partial<Espacio>) =>
  fetchClient<Espacio>(`/espacios/${espacioId}`, {
    method: "PATCH",
    body: JSON.stringify(datosNuevos),
  });

export const agregarEspacio = (datosNuevos: Omit<Espacio, "id">) =>
  fetchClient<Espacio>("/espacios", {
    method: "POST",
    body: JSON.stringify(datosNuevos),
  });

export const deleteEspacio = (espacioId: number) => fetchClient<void>(`/espacios/${espacioId}`, { method: "DELETE" });

export const agregarContacto = (datos: { espacio_id: number, tipo: string, valor: string }) =>
  fetchClient<Contacto>("/contactos", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const eliminarContacto = (contactoId: number) => fetchClient<void>(`/contactos/${contactoId}`, { method: "DELETE" });

export const agregarServicio = (datos: { espacio_id: number, descripcion: string }) =>
  fetchClient<Servicio>("/servicios", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const eliminarServicio = (servicioId: number) => fetchClient<void>(`/servicios/${servicioId}`, { method: "DELETE" });

export const agregarHorario = (datos: { espacio_id: number, dia_semana: number, hora_apertura: string, hora_cierre: string }) =>
  fetchClient<Horario>("/horarios", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const eliminarHorario = (horarioId: number) => fetchClient<void>(`/horarios/${horarioId}`, { method: "DELETE" });

export const subirFoto = (espacioId: number, archivo: File, principal: boolean = false) => {
  const data = new FormData();
  data.append("espacio_id", espacioId.toString());
  data.append("file", archivo);
  data.append("es_principal", principal.toString());

  return fetchClient<Foto>("/fotos", {
    method: "POST",
    body: data,
  });
};

export const editarFoto = (fotoId: number, datos: Partial<Foto>) =>
  fetchClient<Foto>(`/fotos/${fotoId}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });

export const eliminarFoto = (fotoId: number) => fetchClient<void>(`/fotos/${fotoId}`, { method: "DELETE" });
