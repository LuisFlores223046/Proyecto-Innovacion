import { type JSX, useState, useEffect } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import { fetchCategorias } from "../../services/api";
import type { Espacio, Categoria } from "../../types/espacio";
import { agregarEspacio, editarEspacio } from "../../services/api";

interface Props {
    initialData: Espacio | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export default function EspacioForm({ initialData, onSubmit, onCancel }: Props): JSX.Element {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        nombre: initialData?.nombre || "",
        codigo: initialData?.codigo || "",
        notas: initialData?.notas || "",
        categoria_id: initialData?.categoria?.id || "",

        latitud: initialData?.latitud || "",
        longitud: initialData?.longitud || "",
        activo: initialData?.activo ?? true,
        piso_id: initialData?.piso_id || ""
    });

    useEffect(() => {
        async function loadSelectData() {
            try {
                const cats = await fetchCategorias();
                setCategorias(cats);
            } catch (e) {
                console.error("Error al cargar catálogos del formulario:", e);
            } finally {
                setLoading(false);
            }
        }
        loadSelectData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Limpiamos los datos para mandarle al backend EXACTAMENTE lo que pide
        const dataToSend = {
            codigo: formData.codigo,
            nombre: formData.nombre,
            categoria_id: formData.categoria_id ? Number(formData.categoria_id) : null,
            piso_id: formData.piso_id ? Number(formData.piso_id) : null,
            latitud: formData.latitud ? Number(formData.latitud) : null,
            longitud: formData.longitud ? Number(formData.longitud) : null,
            activo: formData.activo,
            notas: formData.notas || null
        };

        try {
            let savedEspacio;
            if (initialData) {
                // @ts-ignore
                savedEspacio = await editarEspacio(initialData.id, dataToSend);
            } else {
                // @ts-ignore
                savedEspacio = await agregarEspacio(dataToSend);
            }
            onSubmit(savedEspacio);
        } catch (error) {
            console.error("Error al guardar el espacio:", error);
            // Podríamos meter un toast de error local aquí si fuera necesario
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando catálogos...</div>;
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Nombre del lugar"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Audiovisual 102"
                />
                <Input
                    label="Código"
                    name="codigo"
                    required
                    value={formData.codigo}
                    onChange={handleChange}
                    placeholder="Ej. A-102"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-gray-700">Notas</label>
                <textarea
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Detalles sobre el lugar..."
                ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="flex flex-col gap-2">
                    <label className="text-gray-700">Categoría</label>
                    <select
                        name="categoria_id"
                        value={formData.categoria_id}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="">-- Seleccionar Categoría --</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Latitud"
                    name="latitud"
                    type="number"
                    step="any"
                    value={formData.latitud}
                    onChange={handleChange}
                    placeholder="Ej. 31.49227"
                />
                <Input
                    label="Longitud"
                    name="longitud"
                    type="number"
                    step="any"
                    value={formData.longitud}
                    onChange={handleChange}
                    placeholder="Ej. -106.415795"
                />
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">{initialData ? "Guardar Cambios" : "Añadir Lugar"}</Button>
            </div>
        </form>
    );
}
