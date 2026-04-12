import { useState } from "react";
import Button from "../../UI/Button";
import { toast } from "sonner";
import { agregarHorario, eliminarHorario } from "../../../services/api";
import type { Horario } from "../../../types/espacio";

interface Props {
  espacioId: number;
  horarios: Horario[];
  onUpdate: () => void;
}

export default function HorariosManager({ espacioId, horarios, onUpdate }: Props) {
  const [nuevoHorario, setNuevoHorario] = useState({ dia_semana: "0", hora_apertura: "08:00", hora_cierre: "20:00" });

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agregarHorario({
        espacio_id: espacioId,
        dia_semana: Number(nuevoHorario.dia_semana),
        hora_apertura: nuevoHorario.hora_apertura,
        hora_cierre: nuevoHorario.hora_cierre
      });
      toast.success("Horario añadido");
      onUpdate();
    } catch (error) { console.error(error); }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarHorario(id);
      toast.success("Horario eliminado");
      onUpdate();
    } catch (error) { console.error(error); }
  };

  const getNombreDia = (dia: number) => {
    const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return dias[dia] || "Desconocido";
  };

  return (
    <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Añadir Horario</h3>
      <form onSubmit={handleAgregar} className="flex gap-4 items-end mb-4 flex-wrap">
        <div className="flex flex-col flex-1 min-w-[110px]">
          <label className="text-sm text-gray-600 mb-1 font-medium">Día</label>
          <select
            value={nuevoHorario.dia_semana}
            onChange={(e) => setNuevoHorario({ ...nuevoHorario, dia_semana: e.target.value })}
            className="px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
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
          <label className="text-sm text-gray-600 mb-1 font-medium">Apertura</label>
          <input
            type="time" value={nuevoHorario.hora_apertura} required
            onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_apertura: e.target.value })}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>
        <div className="flex flex-col flex-[1.5] min-w-[120px]">
          <label className="text-sm text-gray-600 mb-1 font-medium">Cierre</label>
          <input
            type="time" value={nuevoHorario.hora_cierre} required
            onChange={(e) => setNuevoHorario({ ...nuevoHorario, hora_cierre: e.target.value })}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          />
        </div>
        <Button type="submit">Agendar</Button>
      </form>

      <div className="flex flex-col gap-2 mt-6">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Horarios Registrados</h4>
        {horarios.length === 0 ? (
          <p className="text-sm text-gray-400">Sin horarios definidos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {horarios.map(horario => (
              <div key={horario.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm transition-all hover:border-blue-200">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm">{getNombreDia(horario.dia_semana)}</span>
                  <span className="text-xs text-gray-600">{horario.hora_apertura} - {horario.hora_cierre}</span>
                </div>
                <Button variant="link-danger" onClick={() => handleEliminar(horario.id)}>Eliminar</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
