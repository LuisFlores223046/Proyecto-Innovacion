import { useState, useEffect } from "react";
import Button from "../components/UI/Button";
import Modal from "../components/UI/Modal";
import ConfirmModal from "../components/UI/ConfirmModal";
import AdminForm from "../components/Admin/AdminForm";
import { fetchAdmins, eliminarAdmin } from "../services/api";
import type { MeResponse } from "../services/api";
import { toast } from "sonner";

export default function AdminAdministradores() {
    const [admins, setAdmins] = useState<MeResponse[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminAEliminar, setAdminAEliminar] = useState<MeResponse | null>(null);

    const loadAdmins = async () => {
        try {
            const data = await fetchAdmins();
            setAdmins(data);
        } catch (error) {
            console.error("Error al cargar administradores:", error);
        }
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const handleOpenAdd = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSuccess = () => {
        handleCloseModal();
        loadAdmins();
    };

    const handleDelete = async (id: number) => {
        try {
            await eliminarAdmin(id);
            setAdmins(prev => prev.filter(admin => admin.id !== id));
            toast.success("Administrador eliminado con éxito");
        } catch (error) {
            console.error("Error al eliminar administrador:", error);
            toast.error("Error al eliminar el administrador");
        }
        setAdminAEliminar(null);
    };

    const formatFecha = (fechaStr: string) => {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="bg-[#EBF2FD] px-6 py-24 h-full">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-semibold">Administradores</h1>
                <Button onClick={handleOpenAdd}>+ Añadir administrador</Button>
            </div>
            <p className="text-gray-500 font-medium text-center mt-10">
                Gestión de usuarios con acceso al panel de administración
            </p>

            <div className="mt-4 bg-white border border-gray-200 h-[700px] flex flex-col">
                <div className="overflow-y-auto flex-1 h-0">
                    <table className="w-full text-left relative">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 shadow-sm">
                                <th className="px-4 py-3 font-medium bg-gray-50">Usuario</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Correo</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Estado</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Creado en</th>
                                <th className="px-4 py-3 font-medium bg-gray-50">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        Cargando administradores...
                                    </td>
                                </tr>
                            ) : admins.map((admin) => (
                                <tr key={admin.id} className="border-b border-gray-100 transition-colors duration-1000 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{admin.username}</td>
                                    <td className="px-4 py-3">{admin.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${admin.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {admin.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{formatFecha(admin.creado_en)}</td>
                                    <td className="px-4 py-3 flex gap-4">
                                        <Button variant="link-danger" onClick={() => setAdminAEliminar(admin)}>Eliminar</Button>
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
                title="Añadir Nuevo Administrador"
            >
                <AdminForm
                    onSuccess={handleSuccess}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!adminAEliminar}
                onClose={() => setAdminAEliminar(null)}
                title="Eliminar Administrador"
                message={`¿Estás seguro de que deseas eliminar al administrador "${adminAEliminar?.username}"? Esta acción revocará su acceso inmediatamente y no se puede deshacer.`}
                confirmText="Eliminar permanentemente"
                cancelText="Cancelar"
                isDanger={true}
                onConfirm={() => {
                    if (adminAEliminar) handleDelete(adminAEliminar.id);
                }}
            />
        </div>
    );
}