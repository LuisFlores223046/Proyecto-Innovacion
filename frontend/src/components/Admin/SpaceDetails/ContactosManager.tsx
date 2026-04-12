import { useState } from "react";
import Button from "../../UI/Button";
import Input from "../../UI/Input";
import { toast } from "sonner";
import { agregarContacto, eliminarContacto } from "../../../services/api";
import type { Contacto } from "../../../types/espacio";

interface Props {
  espacioId: number;
  contactos: Contacto[];
  onUpdate: () => void;
}

export default function ContactosManager({ espacioId, contactos, onUpdate }: Props) {
  const [nuevoContacto, setNuevoContacto] = useState({ tipo: "telefono", valor: "" });

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoContacto.valor.trim()) return;
    try {
      await agregarContacto({ espacio_id: espacioId, tipo: nuevoContacto.tipo, valor: nuevoContacto.valor.trim() });
      toast.success("Contacto añadido");
      setNuevoContacto({ tipo: nuevoContacto.tipo, valor: "" });
      onUpdate();
    } catch (error) { console.error(error); }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarContacto(id);
      toast.success("Contacto eliminado");
      onUpdate();
    } catch (error) { console.error(error); }
  };

  return (
    <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Contactos</h3>
      <form onSubmit={handleAgregar} className="flex gap-2 items-end mb-4 flex-wrap sm:flex-nowrap">
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
        <div className="flex-[2] min-w-[200px]">
          <Input
            name="valor" 
            value={nuevoContacto.valor} 
            placeholder="Ej. 6561234567 o email@uacj.mx"
            onChange={(e) => setNuevoContacto({ ...nuevoContacto, valor: e.target.value })}
            showLabel={false}
          />
        </div>
        <Button type="submit">Agregar</Button>
      </form>

      <div className="flex flex-col gap-2">
        {contactos.length === 0 ? (
          <p className="text-sm text-gray-500">No hay contactos registrados.</p>
        ) : (
          contactos.map(contacto => (
            <div key={contacto.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
              <div>
                <span className="font-semibold text-gray-700 capitalize text-sm">{contacto.tipo}</span>:
                <span className="ml-2 text-gray-600 text-sm">{contacto.valor}</span>
              </div>
              <Button variant="link-danger" onClick={() => handleEliminar(contacto.id)}>Eliminar</Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
