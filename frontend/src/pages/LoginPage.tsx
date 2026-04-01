import { useState } from "react"
import { toast } from "sonner"
import { Link, useNavigate } from "react-router"
import { useAuth } from "../hooks/useAuth"


export const LoginPage = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!credentials.username.trim() || !credentials.password.trim()) {
            toast.warning('Por favor, completa todos los campos');
            return;
        }
        const result = await login(credentials.username, credentials.password);

        if (!result) {
            toast.error('No fue posible iniciar sesión. Verifica tus datos.');
            return;
        }

        toast.success('Sesión iniciada correctamente');
        navigate('/buscar');
    };

    return (
        <div className="login-container">
            <h1>Iniciar Sesión</h1>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username" // Este name vincula el input con el estado
                    placeholder="Nombre de usuario"
                    value={credentials.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password" // ¡Seguridad corregida!
                    name="password"
                    placeholder="Contraseña"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit">Iniciar</button>
            </form>

            {/* 4. Corregido el HTML semántico (sin un button dentro de un Link) */}
            <Link to='/' className="btn-back" style={{ display: 'block', marginTop: '1rem' }}>
                Volver a la pantalla principal
            </Link>
        </div>
    )
}
