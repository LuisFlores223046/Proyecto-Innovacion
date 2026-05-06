import { useState, useEffect } from "react";
import Button from "../UI/Button";
import Input from "../UI/Input";
import ImageInput from "../UI/ImageInput";
import type { Edificio, Piso } from "../../types/edificio";
import {
  agregarEdificio,
  editarEdificio,
  subirFotoEdificio,
  eliminarFotoEdificio,
  fetchPisos,
  agregarPiso
} from "../../services/api";
import { toast } from "sonner";
import { FaPlus } from "react-icons/fa";

interface Props {
  initialData?: Edificio | null;
  onSubmit: (edificio: any) => void;
  onCancel: () => void;
}

export default function EdificioForm({ initialData, onSubmit, onCancel }: Props) {
  const [currentEdificio, setCurrentEdificio] = useState<Edificio | null>(initialData || null);
  const [formData, setFormData] = useState({
    codigo: initialData?.codigo || "",
    nombre: initialData?.nombre || "",
    descripcion: initialData?.descripcion || "",
    latitud: initialData?.latitud || "",
    longitud: initialData?.longitud || "",
  });

  const [pisos, setPisos] = useState<Piso[]>([]);
  const [newPisoNumero, setNewPisoNumero] = useState("");
  const [isSubmittingPiso, setIsSubmittingPiso] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);

  const edificioId = currentEdificio?.id;

  useEffect(() => {
    if (edificioId) {
      loadPisos();
    }
  }, [edificioId]);

  async function loadPisos() {
    if (!edificioId) return;
    try {
      const data = await fetchPisos(edificioId);
      setPisos(data);
    } catch (e) {
      console.error("Error al cargar pisos:", e);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitInfo = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dataToSend = {
      codigo: formData.codigo,
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      latitud: formData.latitud ? Number(formData.latitud) : null,
      longitud: formData.longitud ? Number(formData.longitud) : null,
      foto_url: currentEdificio?.foto_url || null,
    };

    try {
      let saved;
      if (edificioId) {
        saved = await editarEdificio(edificioId, dataToSend);
        toast.success("Información básica actualizada");
      } else {
        saved = await agregarEdificio(dataToSend);
        toast.success("Edificio creado. Ahora puedes añadir fotos y pisos.");
      }
      setCurrentEdificio(saved);
      onSubmit(saved);
    } catch (error) {
      console.error("Error al guardar el edificio:", error);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!edificioId || !e.target.files?.[0]) return;
    setIsUploadingFoto(true);
    try {
      const saved = await subirFotoEdificio(edificioId, e.target.files[0]);
      setCurrentEdificio(saved);
      toast.success("Foto subida con éxito");
      onSubmit(saved);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingFoto(false);
    }
  };

  const handleDeleteFoto = async () => {
    if (!edificioId) return;
    try {
      const saved = await eliminarFotoEdificio(edificioId);
      setCurrentEdificio(saved);
      toast.success("Foto eliminada");
      onSubmit(saved);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPiso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edificioId || !newPisoNumero.trim()) return;
    setIsSubmittingPiso(true);
    try {
      await agregarPiso({ edificio_id: edificioId, numero: newPisoNumero });
      setNewPisoNumero("");
      loadPisos();
      toast.success("Piso añadido");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingPiso(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* SECCIÓN 1: INFO BÁSICA */}
      <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmitInfo} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código del Edificio"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="Ej: A, B, Gimnasio"
              required
            />
            <Input
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Edificio A, Gimnasio Universitario"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              placeholder="Detalles sobre el edificio..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitud"
              name="latitud"
              type="number"
              step="any"
              value={formData.latitud}
              onChange={handleChange}
              placeholder="Ej. 31.7..."
            />
            <Input
              label="Longitud"
              name="longitud"
              type="number"
              step="any"
              value={formData.longitud}
              onChange={handleChange}
              placeholder="Ej. -106..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cerrar</Button>
            <Button type="submit">{edificioId ? "Actualizar Datos" : "Crear Edificio"}</Button>
          </div>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECCIÓN 2: FOTO */}
        <ImageInput
          handleUploadFoto={handleUploadFoto}
          handleDeleteFoto={handleDeleteFoto}
          isUploadingFoto={isUploadingFoto}
          fotoUrl={currentEdificio?.foto_url}
          entityId={edificioId}
          entityName="Edificio"
        />

        {/* SECCIÓN 3: PISOS */}
        <section className={`relative transition-all duration-300 ${!edificioId ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          {!edificioId && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-2xl">
              <span className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                Bloqueado: Guarda primero el edificio
              </span>
            </div>
          )}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              Gestión de Pisos
            </h3>

            <div className="flex-1">
              {/* Formulario para añadir piso */}
              <form onSubmit={handleAddPiso} className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Ej: Piso 1, PB..."
                  value={newPisoNumero}
                  onChange={(e) => setNewPisoNumero(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingPiso || !newPisoNumero.trim()}
                  className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                >
                  <FaPlus size={14} />
                </button>
              </form>

              {/* Lista de pisos */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                {pisos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No hay pisos registrados</p>
                ) : (
                  pisos.map((piso) => (
                    <div
                      key={piso.id}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group animate-in fade-in slide-in-from-left-2"
                    >
                      <span className="text-sm font-medium text-gray-700">{piso.numero}</span>
                      {/* Por ahora no hay endpoint de eliminar piso en el backend, se queda el icono deshabilitado o informativo */}
                      <span className="text-gray-300 text-xs italic">ID: {piso.id}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
