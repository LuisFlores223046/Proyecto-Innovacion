import { type JSX, useState, useEffect } from "react";
import Input from "../UI/Input";
import Select from "../UI/Select";
import Button from "../UI/Button";
import { fetchCategorias, fetchEdificiosCompleto, fetchEspacioDetalle } from "../../services/api";
import type { Espacio, Categoria, EspacioCompleto } from "../../types/espacio";
import type { Edificio } from "../../types/edificio";
import { agregarEspacio, editarEspacio } from "../../services/api";
import { toast } from "sonner";
import { FaInfoCircle, FaPhone, FaClock, FaImage, FaConciergeBell } from "react-icons/fa";

// Componentes Administradores
import ContactosManager from "./SpaceDetails/ContactosManager";
import ServiciosManager from "./SpaceDetails/ServiciosManager";
import HorariosManager from "./SpaceDetails/HorariosManager";
import FotosManager from "./SpaceDetails/FotosManager";

interface Props {
    initialData: Espacio | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

type TabName = "info" | "contactos" | "servicios" | "horarios" | "fotos";

export default function EspacioForm({ initialData, onSubmit, onCancel }: Props): JSX.Element {
    const [currentEspacio, setCurrentEspacio] = useState<Espacio | null>(initialData);
    const [espacioCompleto, setEspacioCompleto] = useState<EspacioCompleto | null>(null);
    const [activeTab, setActiveTab] = useState<TabName>("info");

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [edificios, setEdificios] = useState<Edificio[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEdificioId, setSelectedEdificioId] = useState<string>("");

    const [formData, setFormData] = useState({
        nombre: currentEspacio?.nombre || "",
        codigo: currentEspacio?.codigo || "",
        notas: currentEspacio?.notas || "",
        categoria_id: currentEspacio?.categoria?.id || "",
        latitud: currentEspacio?.latitud || "",
        longitud: currentEspacio?.longitud || "",
        activo: currentEspacio?.activo ?? true,
        piso_id: currentEspacio?.piso_id || ""
    });

    const isCreated = !!currentEspacio?.id;

    useEffect(() => {
        async function loadData() {
            try {
                const [cats, edifs] = await Promise.all([
                    fetchCategorias(),
                    fetchEdificiosCompleto()
                ]);
                setCategorias(cats);
                setEdificios(edifs);

                if (currentEspacio?.piso_id) {
                    const edif = edifs.find(ed => ed.pisos?.some(p => p.id === currentEspacio.piso_id));
                    if (edif) setSelectedEdificioId(edif.id.toString());
                }

                if (isCreated) {
                    refreshDetails();
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [initialData]);

    const refreshDetails = async () => {
        if (!currentEspacio?.id) return;
        try {
            const full = await fetchEspacioDetalle(currentEspacio.id);
            setEspacioCompleto(full);
        } catch (e) { console.error(e); }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === "edificio_id") {
            setSelectedEdificioId(value);
            setFormData(prev => ({ ...prev, piso_id: "" }));
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmitInfo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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
            let saved;
            if (isCreated) {
                // @ts-ignore
                saved = await editarEspacio(currentEspacio.id, dataToSend);
                toast.success("Información actualizada");
            } else {
                // @ts-ignore
                saved = await agregarEspacio(dataToSend);
                toast.success("Lugar creado. Ahora puedes añadir detalles.");
            }
            setCurrentEspacio(saved);
            onSubmit(saved); // Notificar al padre para actualizar tabla
        } catch (error) {
            console.error(error);
        }
    };

    const handleTabClick = (tab: TabName) => {
        if (tab !== "info" && !isCreated) {
            toast.error("Guarda la información básica primero");
            return;
        }
        setActiveTab(tab);
    }

    const pisosDisponibles = edificios.find(ed => ed.id.toString() === selectedEdificioId)?.pisos || [];

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando...</div>;

    return (
        <div className="flex flex-col w-full">
            {/* TABS HEADER */}
            <div className="flex border-b border-gray-100 gap-4 sm:gap-6 overflow-x-auto custom-scrollbar whitespace-nowrap">
                <TabButton
                    active={activeTab === "info"}
                    icon={<FaInfoCircle />}
                    label="Info Básica"
                    onClick={() => handleTabClick("info")}
                />
                <TabButton
                    active={activeTab === "contactos"}
                    disabled={!isCreated}
                    icon={<FaPhone />}
                    label="Contactos"
                    onClick={() => handleTabClick("contactos")}
                />
                <TabButton
                    active={activeTab === "servicios"}
                    disabled={!isCreated}
                    icon={<FaConciergeBell />}
                    label="Servicios"
                    onClick={() => handleTabClick("servicios")}
                />
                <TabButton
                    active={activeTab === "horarios"}
                    disabled={!isCreated}
                    icon={<FaClock />}
                    label="Horarios"
                    onClick={() => handleTabClick("horarios")}
                />
                <TabButton
                    active={activeTab === "fotos"}
                    disabled={!isCreated}
                    icon={<FaImage />}
                    label="Galería"
                    onClick={() => handleTabClick("fotos")}
                />
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 pb-4 pr-1 pt-4">
                {activeTab === "info" && (
                    <form onSubmit={handleSubmitInfo} noValidate className="flex flex-col gap-6 bg-white p-4 rounded-xl border border-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Nombre del lugar" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej. Audiovisual 102" />
                            <Input label="Código" name="codigo" required value={formData.codigo} onChange={handleChange} placeholder="Ej. A-102" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-gray-700">Notas</label>
                            <textarea
                                name="notas" value={formData.notas} onChange={handleChange} rows={2}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                placeholder="Detalles sobre el lugar..."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                name="categoria_id"
                                label="Categoría"
                                value={formData.categoria_id}
                                onChange={handleChange}
                                required={true}
                                options={categorias.map(cat => ({ value: cat.id, label: cat.nombre }))}
                            />

                            <Select
                                name="edificio_id"
                                label="Edificio (Opcional)"
                                value={selectedEdificioId}
                                onChange={handleChange}
                                placeholder="Exterior"
                                options={edificios.map(ed => ({ value: ed.id, label: ed.nombre }))}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                name="piso_id"
                                label="Piso"
                                value={formData.piso_id}
                                onChange={handleChange}
                                disabled={!selectedEdificioId}
                                options={pisosDisponibles.map(p => ({ value: p.id, label: p.numero }))}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Latitud" name="latitud" type="number" step="any" value={formData.latitud} onChange={handleChange} placeholder="31.4..." />
                                <Input label="Longitud" name="longitud" type="number" step="any" value={formData.longitud} onChange={handleChange} placeholder="-106..." />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button type="button" variant="ghost" onClick={onCancel}>Cerrar</Button>
                            <Button type="submit">{isCreated ? "Actualizar Lugar" : "Crear Lugar"}</Button>
                        </div>
                    </form>
                )}

                {activeTab === "contactos" && isCreated && (
                    <ContactosManager espacioId={currentEspacio!.id} contactos={espacioCompleto?.contactos || []} onUpdate={refreshDetails} />
                )}

                {activeTab === "servicios" && isCreated && (
                    <ServiciosManager espacioId={currentEspacio!.id} servicios={espacioCompleto?.servicios || []} onUpdate={refreshDetails} />
                )}

                {activeTab === "horarios" && isCreated && (
                    <HorariosManager espacioId={currentEspacio!.id} horarios={espacioCompleto?.horarios || []} onUpdate={refreshDetails} />
                )}

                {activeTab === "fotos" && isCreated && (
                    <FotosManager espacioId={currentEspacio!.id} fotos={espacioCompleto?.fotos || []} onUpdate={refreshDetails} />
                )}
            </div>
        </div>
    );
}

function TabButton({ active, label, icon, onClick, disabled }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-all border-b-2 relative ${active
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
                } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
        >
            {icon}
            <span>{label}</span>
            {disabled && <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-gray-300 rounded-full" />}
        </button>
    );
}
