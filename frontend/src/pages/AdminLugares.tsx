import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { FaSearch } from "react-icons/fa";
import { fetchTodosLosEspacios, fetchEdificios, fetchEspaciosPorEdificio, fetchBuscarEspacios } from "../services/api";
import type { Espacio } from "../types/espacio";
import type { Edificio } from "../types/edificio";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import EspacioForm from "../components/Admin/EspacioForm";

export default function AdminLugares() {
    const [espacios, setEspacios] = useState<Espacio[]>([]);
    const [edificiosDict, setEdificiosDict] = useState<Map<number, Edificio>>(new Map());
    
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    // Estados para el Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [espacioAEditar, setEspacioAEditar] = useState<Espacio | null>(null);
    const [espacioAEliminar, setEspacioAEliminar] = useState<Espacio | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Cargar diccionario de edificios (solo una vez)
    useEffect(() => {
        async function buildDict() {
            try {
                const listEdificios = await fetchEdificios();
                const map = new Map<number, Edificio>();
                const promises = listEdificios.map(async (edificio) => {
                    const espaciosEdificio = await fetchEspaciosPorEdificio(edificio.id);
                    espaciosEdificio.forEach(esp => {
                        map.set(esp.id, edificio);
                    });
                });
                await Promise.all(promises);
                setEdificiosDict(map);
            } catch (err) {
                console.error("Error construyendo diccionario de edificios:", err);
            }
        }
        buildDict();
    }, []);

    // Cargar lugares reaccionando a la barra de búsqueda o mapeo de edificios
    useEffect(() => {
        async function loadEspacios() {
            try {
                const results = debouncedSearchTerm.trim() !== ""
                    ? await fetchBuscarEspacios(debouncedSearchTerm)
                    : await fetchTodosLosEspacios();

                const finalEspacios = results.map(esp => ({
                    ...esp,
                    edificio: edificiosDict.get(esp.id) || null
                }));

                setEspacios(finalEspacios);
            } catch (err) {
                console.error("Error cargando lugares:", err);
            }
        }
        
        loadEspacios();
    }, [debouncedSearchTerm, edificiosDict]);

    const handleOpenAdd = () => {
        setEspacioAEditar(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (espacio: Espacio) => {
        setEspacioAEditar(espacio);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEspacioAEditar(null);
    };

    const handleSave = (data: any) => {
        console.log("Datos a guardar:", data);
        toast.success(espacioAEditar ? "Cambios guardados con éxito" : "Lugar añadido con éxito");
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        console.log("Eliminar espacio ID:", id);
        toast.success("Lugar eliminado simuladamente (Aún no hay backend)");
    };

    return (
        <div className="bg-[#EBF2FD] px-6 py-12 h-full">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-semibold">Lugares</h1>
                <Button onClick={handleOpenAdd}>+ Añadir lugar</Button>
            </div>
            <p className="text-gray-500 font-medium text-center mt-10">Todos los lugares en la base de datos</p>
            <div className="mt-4 bg-white border border-gray-200 h-[700px] flex flex-col">
                <div className="flex gap-2 p-4 justify-between shrink-0">
                    <div className="flex gap-2">
                        <Button onClick={() => { }}>Lugares</Button>
                        <Button variant="ghost" onClick={() => { }}>Edificios</Button>
                    </div>
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
                </div>
                <div className="overflow-y-auto flex-1 h-0">
                    <table className="w-full text-left relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 shadow-sm">
                                <th className="px-4 py-3 font-medium bg-gray-50">Lugar</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Edificio</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Categoria</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Latitud</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Longitud</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {espacios.map((espacio) => (
                                <tr key={espacio.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">{espacio.nombre}</td>
                                    <td className="px-4 py-3 ">{espacio.edificio?.nombre || "-"}</td>
                                    <td className="px-4 py-3 ">{espacio.categoria?.nombre || "-"}</td>
                                    <td className="px-4 py-3 ">{espacio.latitud || "-"}</td>
                                    <td className="px-4 py-3 ">{espacio.longitud || "-"}</td>
                                    <td className="px-4 py-3 flex gap-10">
                                        <Button variant="link" onClick={() => handleOpenEdit(espacio)}>Editar</Button>
                                        <Button variant="link-danger" onClick={() => setEspacioAEliminar(espacio)}>Eliminar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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

            <ConfirmModal
                isOpen={!!espacioAEliminar}
                onClose={() => setEspacioAEliminar(null)}
                title="Eliminar Lugar"
                message={`¿Estás seguro de que deseas eliminar "${espacioAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar permanentemente"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={() => {
                    if (espacioAEliminar) {
                        handleDelete(espacioAEliminar.id);
                    }
                }}
            />
        </div>
    )
}