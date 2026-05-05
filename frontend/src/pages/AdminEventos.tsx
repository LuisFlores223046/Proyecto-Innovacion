import { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "../components/UI/Button";
import { fetchEventos, crearEvento, actualizarEvento, eliminarEvento } from "../services/api";
import type { Evento, EventoCreate } from "../types/evento";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import EventoForm from "../components/Admin/EventoForm";

export default function AdminEventos() {
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventoAEditar, setEventoAEditar] = useState<Evento | null>(null);
    const [eventoAEliminar, setEventoAEliminar] = useState<Evento | null>(null);
    const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);

    useEffect(() => {
        async function loadEventos() {
            try {
                const results = await fetchEventos();
                setEventos(results);
            } catch (err) {
                console.error("Error cargando eventos:", err);
            }
        }
        loadEventos();
    }, []);

    const handleOpenAdd = () => {
        setEventoAEditar(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (evento: Evento) => {
        setEventoAEditar(evento);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEventoAEditar(null);
    };

    const handleSave = async (datos: EventoCreate) => {
        try {
            let savedEvento: Evento;
            if (eventoAEditar) {
                savedEvento = await actualizarEvento(eventoAEditar.id, datos);
                setEventos(prev => prev.map(ev => ev.id === savedEvento.id ? savedEvento : ev));
                toast.success("Evento actualizado con éxito");
            } else {
                savedEvento = await crearEvento(datos);
                setEventos(prev => [savedEvento, ...prev]);
                toast.success("Evento añadido con éxito");
            }

            handleCloseModal();
            setHighlightedRowId(savedEvento.id);
            setTimeout(() => setHighlightedRowId(null), 2500);
        } catch (error) {
            console.error("Error al guardar el evento:", error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await eliminarEvento(id);
            setEventos(prev => prev.filter(ev => ev.id !== id));
            toast.success("Evento eliminado con éxito");
        } catch (error) {
            console.error("Error al eliminar evento:", error);
            toast.error("Error al eliminar el evento");
        }
        setEventoAEliminar(null);
    };

    const formatFecha = (fechaStr: string) => {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="bg-[#EBF2FD] px-6 py-24 h-full">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-semibold">Eventos</h1>
                <Button onClick={handleOpenAdd}>+ Añadir evento</Button>
            </div>
            <p className="text-gray-500 font-medium text-center mt-10">
                Todos los eventos programados en la institución
            </p>
            <div className="mt-4 bg-white border border-gray-200 h-[700px] flex flex-col">
                <div className="overflow-y-auto flex-1 h-0">
                    <table className="w-full text-left relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 shadow-sm">
                                <th className="px-4 py-3 font-medium bg-gray-50">Título</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Tipo</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Inicio</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Fin</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Estado</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        No hay eventos registrados.
                                    </td>
                                </tr>
                            ) : eventos.map((evento) => (
                                <tr key={evento.id} className={`border-b border-gray-100 transition-colors duration-1000 ${highlightedRowId === evento.id ? 'bg-green-100' : 'hover:bg-gray-50'}`}>
                                    <td className="px-4 py-3 font-medium">{evento.titulo}</td>
                                    <td className="px-4 py-3 capitalize">{evento.tipo}</td>
                                    <td className="px-4 py-3">{formatFecha(evento.fecha_inicio)}</td>
                                    <td className="px-4 py-3">{evento.fecha_fin ? formatFecha(evento.fecha_fin) : "-"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${evento.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {evento.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 flex gap-4">
                                        <Button variant="link" onClick={() => handleOpenEdit(evento)}>Editar</Button>
                                        <Button variant="link-danger" onClick={() => setEventoAEliminar(evento)}>Eliminar</Button>
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
                title={eventoAEditar ? "Editar Evento" : "Añadir Nuevo Evento"}
            >
                <EventoForm
                    initialData={eventoAEditar}
                    onSubmit={handleSave}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!eventoAEliminar}
                onClose={() => setEventoAEliminar(null)}
                title="Eliminar Evento"
                message={`¿Estás seguro de que deseas eliminar el evento "${eventoAEliminar?.titulo}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar permanentemente"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={() => {
                    if (eventoAEliminar) handleDelete(eventoAEliminar.id);
                }}
            />
        </div>
    );
}