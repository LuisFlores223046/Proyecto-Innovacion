import { createContext, useState, useEffect, type PropsWithChildren } from "react";
import { admins, type Admin } from "../mock/AdminMock";

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthContextProps {
    status: AuthStatus;
    admin: Admin | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const AuthContext = createContext({} as AuthContextProps);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [status, setStatus] = useState<AuthStatus>('checking');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // TODO: Hacer una petición GET a /me para validar el token y obtener los datos del admin
            // Por ahora, simulamos que el token es válido y usamos el primer administrador
            setAdmin(admins[0]);
            setStatus('authenticated');
        } else {
            setStatus('unauthenticated');
        }
    }, []);

    const handleLogin = async (username: string, password: string) => {
        setStatus('checking');

        // TODO: Reemplazar esta busqueda local con una peticion POST a la ruta /login de FastAPI usando axios y variables de entorno. 
        // Despues de recibir el access_token, guardarlo y hacer un GET a la ruta /me para obtener y guardar los datos del administrador en el estado.

        const foundAdmin = admins.find(a => a.username === username);

        // Para propósito de pruebas con mocks, requerimos la contraseña "admin123"
        if (!foundAdmin || password !== "admin123") {
            console.warn('Credenciales incorrectas');
            setAdmin(null);
            setStatus('unauthenticated');
            return false;
        }

        //simulamos el token de jwt
        const mockToken = "mock_jwt_access_token_bearer";
        localStorage.setItem('access_token', mockToken);

        setAdmin(foundAdmin);
        setStatus('authenticated');
        return true;
    };

    const handleLogout = () => {
        //limpiamos el token y el estado
        localStorage.removeItem('access_token');
        setAdmin(null);
        setStatus('unauthenticated');
    };

    return (
        <AuthContext.Provider
            value={{
                status,
                admin,
                isAuthenticated: status === 'authenticated',
                login: handleLogin,
                logout: handleLogout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};