import { useState } from "react"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { useAuth } from "../hooks/useAuth"
import logo from "../assets/logo_uacj.png"
import loginImage from "../assets/login_image.png"


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
        <div className="min-h-screen flex flex-col justify-end sm:justify-end items-center relative bg-gradient-to-b from-[#003f88] to-[#2a8dff] gap-4 overflow-hidden">

            <img src={logo} alt="Logo UACJ" className="w-[250px] relative z-20 pointer-events-none" style={{ filter: 'brightness(0) invert(1)' }} />

            <div className="relative w-full sm:w-[420px] z-10">

                <div className="absolute -top-4 left-7 right-7 h-20 bg-white/40 backdrop-blur-md rounded-t-[40px] -z-10"></div>

                <form onSubmit={handleSubmit} noValidate className="bg-white w-full rounded-t-[40px] pt-10 pb-12 px-8 sm:p-10 shadow-2xl flex flex-col gap-4 h-[75vh] justify-center sm:justify-start relative z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-center mb-2">Inicia Sesión</h1>
                        <h2 className="text-center mb-6 text-gray-600 text-lg">Ingresa tus datos a continuación</h2>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="username">Nombre de usuario</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="Nombre de usuario"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button type="submit" className="w-full px-4 py-3 bg-[#003DA5] text-white rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:bg-[#002b75]">
                        Iniciar Sesión
                    </button>
                </form>
            </div>

            <img src={loginImage} alt="Login" className="hidden sm:block absolute bottom-[-300px] w-[1500px] object-cover z- max-w-[1500px] pointer-events-none z-10" />
        </div>
    )
}
