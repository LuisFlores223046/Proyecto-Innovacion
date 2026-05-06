import { createContext, useState, useEffect, type PropsWithChildren } from "react";
// import { admins, type Admin } from "../mock/AdminMock";
import { getMe, loginAdmin, type MeResponse as Admin } from "../services/api";


type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthContextProps {
    status: AuthStatus;
    admin: Admin | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [status, setStatus] = useState<AuthStatus>('checking');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            const validarSesion = async () => {
                try {
                    const adminData = await getMe();
                    setAdmin(adminData);
                    setStatus('authenticated');
                } catch (error) {
                    console.error("Error al validar sesión:", error);
                    localStorage.removeItem('access_token');
                    setStatus('unauthenticated');
                }
            }
            validarSesion();
        } else {
            setStatus('unauthenticated');
        }
    }, []);

    const handleLogin = async (username: string, password: string) => {
        setStatus('checking');
        try {
            const res = await loginAdmin({ username, password });
            localStorage.setItem("access_token", res.access_token);
            const adminData = await getMe();
            setAdmin(adminData);
            setStatus("authenticated");
            return true;
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            setAdmin(null);
            setStatus("unauthenticated");
            return false;
        }
    };

    const handleLogout = () => {
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