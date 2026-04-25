import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SideBarAdmin } from "../Admin/SideBarAdmin";

export const ProtectedRoute = () => {
    const { isAuthenticated, status } = useAuth();

    if (status === 'checking') {
        return <div>Cargando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex flex-col sm:flex-row h-screen">
            <SideBarAdmin />
            <main className="h-full sm:flex-1 sm:overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};