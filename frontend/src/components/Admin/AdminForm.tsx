import { type JSX, useState } from "react";
import Input from "../UI/Input";
import Button from "../UI/Button";
import { crearAdmin } from "../../services/api";
import { toast } from "sonner";

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AdminForm({ onSuccess, onCancel }: Props): JSX.Element {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error("Las contraseñas no coinciden");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("La contraseña debe tener al menos 8 caracteres");
            return;
        }

        try {
            setLoading(true);
            await crearAdmin({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            toast.success("Administrador creado exitosamente");
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-4 rounded-xl border border-gray-50">
            <Input 
                label="Nombre de Usuario" 
                name="username" 
                required 
                value={formData.username} 
                onChange={handleChange} 
                placeholder="Ej. admin_juan" 
            />

            <Input 
                label="Correo Electrónico" 
                name="email" 
                type="email"
                required 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Ej. juan@uacj.mx" 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                    label="Contraseña" 
                    name="password" 
                    type="password"
                    required 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Min. 8 caracteres" 
                />
                
                <Input 
                    label="Confirmar Contraseña" 
                    name="confirmPassword" 
                    type="password"
                    required 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="Repite la contraseña" 
                />
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? "Creando..." : "Crear Administrador"}
                </Button>
            </div>
        </form>
    );
}
