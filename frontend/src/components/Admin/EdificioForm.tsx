import { useState, useEffect } from "react";
import Button from "../UI/Button";
import Input from "../UI/Input";
import type { Edificio } from "../../types/edificio";
import { agregarEdificio, editarEdificio } from "../../services/api";

interface Props {
  initialData?: Edificio | null;
  onSubmit: (edificio: any) => void;
  onCancel: () => void;
}

export default function EdificioForm({ initialData, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState({
    codigo: initialData?.codigo || "",
    nombre: initialData?.nombre || "",
    descripcion: initialData?.descripcion || "",
    latitud: initialData?.latitud || "",
    longitud: initialData?.longitud || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        codigo: initialData.codigo || "",
        nombre: initialData.nombre || "",
        descripcion: initialData.descripcion || "",
        latitud: initialData.latitud || "",
        longitud: initialData.longitud || "",
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const dataToSend = {
      codigo: formData.codigo,
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      latitud: formData.latitud ? Number(formData.latitud) : null,
      longitud: formData.longitud ? Number(formData.longitud) : null,
    };

    try {
      let savedEdificio;
      if (initialData) {
        // @ts-ignore
        savedEdificio = await editarEdificio(initialData.id, dataToSend);
      } else {
        // @ts-ignore
        savedEdificio = await agregarEdificio(dataToSend);
      }
      onSubmit(savedEdificio);
    } catch (error) {
      console.error("Error al guardar el edificio:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
        <label className="text-gray-700">Descripción</label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
          placeholder="Ej. 31.733..."
        />
        <Input
          label="Longitud"
          name="longitud"
          type="number"
          step="any"
          value={formData.longitud}
          onChange={handleChange}
          placeholder="Ej. -106.48..."
        />
      </div>

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialData ? "Guardar Cambios" : "Añadir Edificio"}</Button>
      </div>
    </form>
  );
}
