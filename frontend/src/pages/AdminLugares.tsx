import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { FaSearch } from "react-icons/fa";
import { fetchTodosLosEspacios, fetchBuscarEspacios, deleteEspacio, fetchEdificios, eliminarEdificio, fetchEspacioDetalle } from "../services/api";
import type { Espacio } from "../types/espacio";
import type { Edificio } from "../types/edificio";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import EspacioForm from "../components/Admin/EspacioForm";
import EdificioForm from "../components/Admin/EdificioForm";

type ActiveTab = "lugares" | "edificios";

export default function AdminLugares() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("lugares");

    // --- Estados para Lugares ---
    const [espacios, setEspacios] = useState<Espacio[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [espacioAEditar, setEspacioAEditar] = useState<Espacio | null>(null);
    const [espacioAEliminar, setEspacioAEliminar] = useState<Espacio | null>(null);
    const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);
    const [espacioAdministrar, setEspacioAdministrar] = useState<Espacio | null>(null);

    // --- Estados para Edificios ---
    const [edificios, setEdificios] = useState<Edificio[]>([]);
    const [isEdificioModalOpen, setIsEdificioModalOpen] = useState(false);
    const [edificioAEditar, setEdificioAEditar] = useState<Edificio | null>(null);
    const [highlightedEdificioId, setHighlightedEdificioId] = useState<number | null>(null);
    const [edificioAEliminar, setEdificioAEliminar] = useState<Edificio | null>(null);

    // Debounce para búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Cargar lugares reaccionando a la barra de búsqueda
    useEffect(() => {
        if (activeTab !== "lugares") return;
        async function loadEspacios() {
            try {
                const results = debouncedSearchTerm.trim() !== ""
                    ? await fetchBuscarEspacios(debouncedSearchTerm)
                    : await fetchTodosLosEspacios();
                setEspacios(results);
            } catch (err) {
                console.error("Error cargando lugares:", err);
            }
        }
        loadEspacios();
    }, [debouncedSearchTerm, activeTab]);

    // Cargar edificios al cambiar de pestaña
    useEffect(() => {
        if (activeTab !== "edificios") return;
        async function loadEdificios() {
            try {
                const results = await fetchEdificios();
                setEdificios(results);
            } catch (err) {
                console.error("Error cargando edificios:", err);
            }
        }
        loadEdificios();
    }, [activeTab]);

    // --- Handlers Espacios ---
    const handleOpenAdd = () => {
        setEspacioAEditar(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (espacio: Espacio, tab: any = "info") => {
        setEspacioAEditar(espacio);
        setIsModalOpen(true);
        // Podríamos pasar el tab al formulario si quisiéramos, 
        // pero por ahora abrimos el formulario centralizado.
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEspacioAEditar(null);
    };

    const handleSave = (savedEspacio: Espacio) => {
        if (espacioAEditar) {
            setEspacios(prev => prev.map(esp => esp.id === savedEspacio.id ? savedEspacio : esp));
        } else {
            setEspacios(prev => [savedEspacio, ...prev]);
        }

        toast.success(espacioAEditar ? "Cambios guardados con éxito" : "Lugar añadido con éxito");
        handleCloseModal();

        // Disparar la animación
        setHighlightedRowId(savedEspacio.id);
        setTimeout(() => setHighlightedRowId(null), 2500);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteEspacio(id);
            setEspacios(prev => prev.filter(esp => esp.id !== id));
            toast.success("Lugar eliminado con éxito");
        } catch (error) {
            console.error("Error al eliminar espacio:", error);
            toast.error("Error al eliminar el lugar");
        }
        setEspacioAEliminar(null);
    };

    // --- Handlers Edificios ---
    const handleOpenAddEdificio = () => {
        setEdificioAEditar(null);
        setIsEdificioModalOpen(true);
    };

    const handleOpenEditEdificio = (edificio: Edificio) => {
        setEdificioAEditar(edificio);
        setIsEdificioModalOpen(true);
    };

    const handleCloseEdificioModal = () => {
        setIsEdificioModalOpen(false);
        setEdificioAEditar(null);
    };

    const handleSaveEdificio = (savedEdificio: Edificio) => {
        if (edificioAEditar) {
            setEdificios(prev => prev.map(ed => ed.id === savedEdificio.id ? savedEdificio : ed));
        } else {
            setEdificios(prev => [savedEdificio, ...prev]);
        }

        toast.success(edificioAEditar ? "Edificio actualizado con éxito" : "Edificio añadido con éxito");
        handleCloseEdificioModal();

        setHighlightedEdificioId(savedEdificio.id);
        setTimeout(() => setHighlightedEdificioId(null), 2500);
    };

    const handleDeleteEdificio = async (edificioId: number) => {
        try {
            await eliminarEdificio(edificioId);
            setEdificios(prev => prev.filter(ed => ed.id !== edificioId));
            toast.success("Se eliminó el edificio con éxito!")
        } catch (error) {
            console.log("Ocurrio un error al eliminar el edificio: ", error)
            toast.error("Error al eliminar el edificio")
        }
    }

    // cambio de pestaña
    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setSearchTerm("");
        setDebouncedSearchTerm("");
    };

    return (
        <div className="bg-[#EBF2FD] px-6 py-24 h-full">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-semibold">
                    {activeTab === "lugares" ? "Lugares" : "Edificios"}
                </h1>
                {activeTab === "lugares" ? (
                    <Button onClick={handleOpenAdd}>+ Añadir lugar</Button>
                ) : (
                    <Button onClick={handleOpenAddEdificio}>+ Añadir edificio</Button>
                )}
            </div>
            <p className="text-gray-500 font-medium text-center mt-10">
                {activeTab === "lugares"
                    ? "Todos los lugares en la base de datos"
                    : "Todos los edificios en la base de datos"}
            </p>
            <div className="mt-4 bg-white border border-gray-200 h-[700px] flex flex-col">
                <div className="flex gap-2 p-4 justify-between items-center shrink-0 min-h-[72px]">
                    <div className="flex gap-2">
                        <Button
                            variant={activeTab === "lugares" ? undefined : "ghost"}
                            onClick={() => handleTabChange("lugares")}
                        >
                            Lugares
                        </Button>
                        <Button
                            variant={activeTab === "edificios" ? undefined : "ghost"}
                            onClick={() => handleTabChange("edificios")}
                        >
                            Edificios
                        </Button>
                    </div>
                    {activeTab === "lugares" && (
                        <div className="flex gap-2">
                            <Input
                                label="Buscar"
                                name="buscar"
                                placeholder="Buscar lugar"
                                showLabel={false}
                                icon={<FaSearch size={20} />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="overflow-y-auto flex-1 h-0">
                    {/* tabla de lugares*/}
                    {activeTab === "lugares" && (
                        <table className="w-full text-left relative">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 shadow-sm">
                                    <th className="px-4 py-3 font-medium bg-gray-50">Código</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Lugar</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Categoría</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Latitud</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Longitud</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {espacios.map((espacio) => (
                                    <tr key={espacio.id} className={`border-b border-gray-100 transition-colors duration-1000 ${highlightedRowId === espacio.id ? 'bg-green-100' : 'hover:bg-gray-50'
                                        }`}>
                                        <td className="px-4 py-3">{espacio.codigo}</td>
                                        <td className="px-4 py-3">{espacio.nombre}</td>
                                        <td className="px-4 py-3 ">{espacio.categoria?.nombre || "-"}</td>
                                        <td className="px-4 py-3 ">{espacio.latitud || "-"}</td>
                                        <td className="px-4 py-3 ">{espacio.longitud || "-"}</td>
                                        <td className="px-4 py-3 flex gap-4">
                                            <Button variant="link" onClick={() => handleOpenEdit(espacio)}>Editar</Button>
                                            <Button variant="link-danger" onClick={() => setEspacioAEliminar(espacio)}>Eliminar</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* tabla de edificios */}
                    {activeTab === "edificios" && (
                        <table className="w-full text-left relative">
                            <thead className="sticky top-0 z-10">
                                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 shadow-sm">
                                    <th className="px-4 py-3 font-medium bg-gray-50">Código</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Nombre</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Descripción</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Latitud</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Longitud</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Foto</th>
                                    <th className="px-4 py-3 font-medium bg-gray-50">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {edificios.map((edificio) => (
                                    <tr key={edificio.id} className={`border-b border-gray-100 transition-colors duration-1000 ${highlightedEdificioId === edificio.id ? 'bg-green-100' : 'hover:bg-gray-50'
                                        }`}>
                                        <td className="px-4 py-3">{edificio.codigo}</td>
                                        <td className="px-4 py-3">{edificio.nombre}</td>
                                        <td className="px-4 py-3 max-w-[200px] truncate">
                                            {edificio.descripcion || "-"}
                                        </td>
                                        <td className="px-4 py-3">{edificio.latitud || "-"}</td>
                                        <td className="px-4 py-3">{edificio.longitud || "-"}</td>
                                        <td className="px-4 py-3">
                                            {edificio.foto_url ? (
                                                <img src={edificio.foto_url} alt={edificio.nombre} className="w-10 h-10 object-cover rounded-full" />
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="px-4 py-3 flex gap-4">
                                            <Button variant="link" onClick={() => handleOpenEditEdificio(edificio)}>Editar</Button>
                                            <Button
                                                variant="link-danger"
                                                onClick={() => setEdificioAEliminar(edificio)}
                                            >
                                                Eliminar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal para Espacios */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={espacioAEditar ? "Editar Lugar" : "Añadir Nuevo Lugar"}
            >
                <EspacioForm
                    initialData={espacioAEditar}
                    onSubmit={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>

            {/* Modal para Edificios */}
            <Modal
                isOpen={isEdificioModalOpen}
                onClose={handleCloseEdificioModal}
                title={edificioAEditar ? "Editar Edificio" : "Añadir Nuevo Edificio"}
            >
                <EdificioForm
                    initialData={edificioAEditar}
                    onSubmit={handleSaveEdificio}
                    onCancel={handleCloseEdificioModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!espacioAEliminar || !!edificioAEliminar}
                onClose={() => { setEspacioAEliminar(null); setEdificioAEliminar(null); }}
                title={`${espacioAEliminar ? "Eliminar Lugar" : "Eliminar Edificio"}`}
                message={`¿Estás seguro de que deseas eliminar "${espacioAEliminar?.nombre || edificioAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar permanentemente"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={() => {
                    if (espacioAEliminar) {
                        handleDelete(espacioAEliminar.id);
                    } else if (edificioAEliminar) {
                        handleDeleteEdificio(edificioAEliminar.id);
                    }
                }}
            />
        </div>
    )
}