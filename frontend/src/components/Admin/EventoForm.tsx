import { type JSX, useState, useEffect } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import Select from "../UI/Select";
import { fetchTodosLosEspacios } from "../../services/api";
import type { Evento, EventoCreate } from "../../types/evento";
import type { Espacio } from "../../types/espacio";

interface Props {
    initialData: Evento | null;
    onSubmit: (data: EventoCreate) => void;
    onCancel: () => void;
}

export default function EventoForm({ initialData, onSubmit, onCancel }: Props): JSX.Element {
    const [espacios, setEspacios] = useState<Espacio[]>([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        titulo: initialData?.titulo || "",
        descripcion: initialData?.descripcion || "",
        espacio_id: initialData?.espacio_id?.toString() || "",
        fecha_inicio: initialData?.fecha_inicio ? new Date(initialData.fecha_inicio).toISOString().slice(0, 16) : "",
        fecha_fin: initialData?.fecha_fin ? new Date(initialData.fecha_fin).toISOString().slice(0, 16) : "",
        tipo: initialData?.tipo || "otro",
        url_registro: initialData?.url_registro || "",
        activo: initialData?.activo ?? true,
    });

    useEffect(() => {
        async function loadData() {
            try {
                const results = await fetchTodosLosEspacios();
                setEspacios(results);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any;
        const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Convert to EventoCreate format
        const dataToSend: EventoCreate = {
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            espacio_id: formData.espacio_id ? Number(formData.espacio_id) : null,
            fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
            fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null,
            tipo: formData.tipo as any,
            url_registro: formData.url_registro || null,
            foto_url: initialData?.foto_url || null,
            activo: formData.activo,
        };

        onSubmit(dataToSend);
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando...</div>;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white rounded-xl border border-gray-50">
            <Input
                label="Título del Evento"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Ej. Conferencia Magistral"
            />

            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Descripción</label>
                <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder="Detalles sobre el evento..."
                ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                    name="tipo"
                    label="Tipo de Evento"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                    options={[
                        { value: "academico", label: "Académico" },
                        { value: "deportivo", label: "Deportivo" },
                        { value: "cultural", label: "Cultural" },
                        { value: "administrativo", label: "Administrativo" },
                        { value: "otro", label: "Otro" }
                    ]}
                />

                <Select
                    name="espacio_id"
                    label="Lugar (Opcional)"
                    value={formData.espacio_id}
                    onChange={handleChange}
                    placeholder="Sin lugar especificado"
                    options={espacios.map(esp => ({ value: esp.id, label: esp.nombre }))}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Fecha y Hora de Inicio</label>
                    <input
                        type="datetime-local"
                        name="fecha_inicio"
                        required
                        value={formData.fecha_inicio}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Fecha y Hora de Fin (Opcional)</label>
                    <input
                        type="datetime-local"
                        name="fecha_fin"
                        value={formData.fecha_fin}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    />
                </div>
            </div>

            <Input
                label="URL de Registro (Opcional)"
                name="url_registro"
                value={formData.url_registro}
                onChange={handleChange}
                placeholder="Ej. https://forms.gle/..."
            />

            <div className="flex items-center gap-2 mt-2">
                <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-semibold text-gray-700">Evento Activo</label>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={onCancel}>Cerrar</Button>
                <Button type="submit">{initialData ? "Actualizar Evento" : "Crear Evento"}</Button>
            </div>
        </form>
    );
}
