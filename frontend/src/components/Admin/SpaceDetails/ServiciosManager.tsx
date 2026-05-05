import { useState } from "react";
import Button from "../../UI/Button";
import Input from "../../UI/Input";
import { toast } from "sonner";
import { agregarServicio, eliminarServicio } from "../../../services/api";
import type { Servicio } from "../../../types/espacio";

interface Props {
  espacioId: number;
  servicios: Servicio[];
  onUpdate: () => void;
}

export default function ServiciosManager({ espacioId, servicios, onUpdate }: Props) {
  const [nuevoServicio, setNuevoServicio] = useState("");

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoServicio.trim()) return;
    try {
      await agregarServicio({ espacio_id: espacioId, descripcion: nuevoServicio.trim() });
      toast.success("Servicio añadido");
      setNuevoServicio("");
      onUpdate();
    } catch (error) { console.error(error); }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarServicio(id);
      toast.success("Servicio eliminado");
      onUpdate();
    } catch (error) { console.error(error); }
  };

  return (
    <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Servicios</h3>
      <form onSubmit={handleAgregar} className="flex gap-2 items-end mb-4">
        <div className="flex-1">
          <Input
            name="servicio" 
            value={nuevoServicio} 
            placeholder="Ej. Proyector, WiFi, Pizarrón..."
            onChange={(e) => setNuevoServicio(e.target.value)}
            showLabel={false}
          />
        </div>
        <Button type="submit">Agregar</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {servicios.length === 0 ? (
          <p className="text-sm text-gray-500">No hay servicios registrados.</p>
        ) : (
          servicios.map(servicio => (
            <div key={servicio.id} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
              {servicio.descripcion}
              <button
                type="button" 
                onClick={() => handleEliminar(servicio.id)} 
                title="Eliminar servicio"
                className="text-blue-500 hover:text-red-500 font-bold ml-1 outline-none"
              >×</button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
