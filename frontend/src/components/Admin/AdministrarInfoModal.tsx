import { useState, useEffect, useRef } from "react";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { toast } from "sonner";
import {
  fetchEspacioDetalle,
  agregarContacto, eliminarContacto,
  agregarServicio, eliminarServicio,
  agregarHorario, eliminarHorario,
  subirFoto, eliminarFoto, editarFoto
} from "../../services/api";
import type { Espacio, EspacioCompleto } from "../../types/espacio";

interface AdministrarInfoModalProps {
  espacio: Espacio;
  onClose: () => void;
}

type TabName = "general" | "horarios" | "fotos";

export default function AdministrarInfoModal({ espacio, onClose }: AdministrarInfoModalProps) {
  const [detalles, setDetalles] = useState<EspacioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>("general");

  // Estados form Contactos
  const [nuevoContacto, setNuevoContacto] = useState({ tipo: "telefono", valor: "" });

  // Estados form Servicios
  const [nuevoServicio, setNuevoServicio] = useState("");

  // Estados form Horarios
  const [nuevoHorario, setNuevoHorario] = useState({ dia_semana: "0", hora_apertura: "08:00", hora_cierre: "20:00" });

  // Estados form Fotos
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [fotoEsPrincipal, setFotoEsPrincipal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const data = await fetchEspacioDetalle(espacio.id);
      setDetalles(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar detalles del espacio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalles();
  }, [espacio.id]);

  // --- Handlers Generales (Contactos y Servicios) ---
  const handleAgregarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoContacto.valor.trim()) return;
    try {
      await agregarContacto({ espacio_id: espacio.id, tipo: nuevoContacto.tipo, valor: nuevoContacto.valor.trim() });
      toast.success("Contacto añadido");
      setNuevoContacto({ tipo: nuevoContacto.tipo, valor: "" });
      cargarDetalles();
    } catch (error) { console.error(error); }
  };

  const handleEliminarContacto = async (id: number) => {
    try {
      await eliminarContacto(id);
      toast.success("Contacto eliminado");
      cargarDetalles();
    } catch (error) { console.error(error); }
  };

  const handleAgregarServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoServicio.trim()) return;
    try {
      await agregarServicio({ espacio_id: espacio.id, descripcion: nuevoServicio.trim() });
      toast.success("Servicio añadido");
      setNuevoServicio("");
      cargarDetalles();
    } catch (error) { console.error(error); }
  };

  const handleEliminarServicio = async (id: number) => {
    try {
      await eliminarServicio(id);
      toast.success("Servicio eliminado");
      cargarDetalles();
    } catch (error) { console.error(error); }
  };

  // --- Handlers Horarios ---
  const handleAgregarHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agregarHorario({
        espacio_id: espacio.id,
        dia_semana: Number(nuevoHorario.dia_semana),
        hora_apertura: nuevoHorario.hora_apertura,
        hora_cierre: nuevoHorario.hora_cierre
      });
      toast.success("Horario añadido");
      cargarDetalles();
    } catch (error) { console.error(error); }
  };

  const handleEliminarHorario = async (id: number) => {
    try {
      await eliminarHorario(id);
      toast.success("Horario eliminado");
      cargarDetalles();
    } catch (error) { console.error(error); }
  };

  const getNombreDia = (dia: number) => {
    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return dias[dia] || "Desconocido";
  };

  // --- Handlers Fotos ---
  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivoFoto(e.target.files[0]);
    }
  };

  const handleSubirFoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoFoto) {
      toast.error("Selecciona una imagen primero");
      return;
    }
    try {
      setIsUploading(true);

      // Si el usuario marcó "Principal", buscamos si ya existen otras principales y las apagamos
      if (fotoEsPrincipal && detalles?.fotos) {
        const fotosPrincipalesAnteriores = detalles.fotos.filter(f => f.es_principal);
        // Despromovemos las anteriores antes de subir la nueva para evitar conflictos de UX
        for (const fotoVieja of fotosPrincipalesAnteriores) {
          await editarFoto(fotoVieja.id, { es_principal: false });
        }
      }

      await subirFoto(espacio.id, archivoFoto, fotoEsPrincipal);
      toast.success("Foto subida exitosamente");
      setArchivoFoto(null);
      setFotoEsPrincipal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      cargarDetalles();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEliminarFoto = async (id: number) => {
    try {
      await eliminarFoto(id);
      toast.success("Foto eliminada");
      cargarDetalles();
    } catch (error) { console.error(error); }
  };


  if (loading || !detalles) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando información...</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto h-fit pr-2">

      {/* Sistema de Pestañas */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Contactos y Servicios
        </button>
        <button
          onClick={() => setActiveTab("horarios")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "horarios" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Horarios
        </button>
        <button
          onClick={() => setActiveTab("fotos")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "fotos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Galería de Fotos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 mt-2 pb-4">

        {/* PESTAÑA 1: GENERAL */}
        {activeTab === "general" && (
          <div className="flex flex-col gap-6">
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contactos</h3>
              <form onSubmit={handleAgregarContacto} className="flex gap-2 items-end mb-4">
                <div className="flex flex-col flex-1">
                  <select
                    value={nuevoContacto.tipo}
                    onChange={(e) => setNuevoContacto({ ...nuevoContacto, tipo: e.target.value })}
                    className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="telefono">Teléfono</option>
                    <option value="correo">Correo</option>
                    <option value="extension">Extensión</option>
                  </select>
                </div>
                <div className="flex-[2]">
                  <Input
                    name="valor" value={nuevoContacto.valor} placeholder="Ej. 6561234567 o email@uacj.mx"
                    onChange={(e) => setNuevoContacto({ ...nuevoContacto, valor: e.target.value })}
                  />
                </div>
                <Button type="submit">Agregar</Button>
              </form>

              <div className="flex flex-col gap-2">
                {detalles.contactos.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay contactos registrados.</p>
                ) : (
                  detalles.contactos.map(contacto => (
                    <div key={contacto.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                      <div>
                        <span className="font-semibold text-gray-700 capitalize">{contacto.tipo}</span>:
                        <span className="ml-2 text-gray-600">{contacto.valor}</span>
                      </div>
                      <Button variant="link-danger" onClick={() => handleEliminarContacto(contacto.id)}>Eliminar</Button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Servicios</h3>
              <form onSubmit={handleAgregarServicio} className="flex gap-2 items-end mb-4">
                <div className="flex-1">
                  <Input
                    name="servicio" value={nuevoServicio} placeholder="Ej. Proyector, WiFi, Pizarrón..."
                    onChange={(e) => setNuevoServicio(e.target.value)}
                  />
                </div>
                <Button type="submit">Agregar</Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {detalles.servicios.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay servicios registrados.</p>
                ) : (
                  detalles.servicios.map(servicio => (
                    <div key={servicio.id} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
                      {servicio.descripcion}
                      <button
                        type="button" onClick={() => handleEliminarServicio(servicio.id)} title="Eliminar servicio"
                        className="text-blue-500 hover:text-red-500 font-bold ml-1 outline-none"
                      >×</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* PESTAÑA 2: HORARIOS */}
        {activeTab === "horarios" && (
          <div className="flex flex-col gap-6">
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Añadir Horario</h3>
              <form onSubmit={handleAgregarHorario} className="flex gap-4 items-end mb-4 flex-wrap">
                <div className="flex flex-col flex-1 min-w-[110px]">
                  <label className="text-sm text-gray-600 mb-1">Día</label>
                  <select
                    value={nuevoHorario.dia_semana}
                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, dia_semana: e.target.value })}
                    className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="0">Lunes</option>
                    <option value="1">Martes</option>
                    <option value="2">Miércoles</option>
                    <option value="3">Jueves</option>
                    <option value="4">Viernes</option>
                    <option value="5">Sábado</option>
                    <option value="6">Domingo</option>
                  </select>
                </div>
                <div className="flex flex-col flex-[1.5] min-w-[120px]">
                  <label className="text-sm text-gray-600 mb-1">Apertura</label>
                  <input
                    type="time" value={nuevoHorario.hora_apertura} required
                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_apertura: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="flex flex-col flex-[1.5] min-w-[120px]">
                  <label className="text-sm text-gray-600 mb-1">Cierre</label>
                  <input
                    type="time" value={nuevoHorario.hora_cierre} required
                    onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_cierre: e.target.value })}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="pb-0.5">
                  <Button type="submit">Agendar</Button>
                </div>
              </form>

              <div className="flex flex-col gap-2 mt-6">
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-1">Horarios Registrados</h4>
                {detalles.horarios.length === 0 ? (
                  <p className="text-sm text-gray-500">El lugar no tiene horarios definidos.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detalles.horarios.map(horario => (
                      <div key={horario.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{getNombreDia(horario.dia_semana)}</span>
                          <span className="text-sm text-gray-600">{horario.hora_apertura} - {horario.hora_cierre}</span>
                        </div>
                        <Button variant="link-danger" onClick={() => handleEliminarHorario(horario.id)}>Eliminar</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* PESTAÑA 3: FOTOS */}
        {activeTab === "fotos" && (
          <div className="flex flex-col gap-6">
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Subir Imagen</h3>
              <form onSubmit={handleSubirFoto} className="flex flex-col gap-4 mb-2">
                <div className="flex gap-4 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleArchivoChange}
                    ref={fileInputRef}
                    className="flex-1 px-4 py-2 mb-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cb-principal"
                      checked={fotoEsPrincipal}
                      onChange={(e) => setFotoEsPrincipal(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="cb-principal" className="text-sm text-gray-700 select-none cursor-pointer">Definir como Principal</label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Subiendo web..." : "Añadir a Galería"}
                  </Button>
                </div>
              </form>

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-3">Galería ({detalles.fotos?.length || 0})</h4>
                {(!detalles.fotos || detalles.fotos.length === 0) ? (
                  <p className="text-sm text-gray-500">Este lugar no tiene fotos todavía.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {detalles.fotos.map(foto => (
                      <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                        <img src={foto.url} alt="Lugar" className="w-full h-full object-cover" />
                        {foto.es_principal && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md shadow-md font-bold">
                            Principal
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleEliminarFoto(foto.id)}
                            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 transform transition-transform scale-95 group-hover:scale-100 shadow-xl"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

      </div>


    </div>
  );
}
