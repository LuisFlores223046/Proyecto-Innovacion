import logo from "../../assets/logo_uacj.png";
import { NavLink } from "react-router-dom";
import { FaMapMarkerAlt, FaCalendar, FaUser, FaSignOutAlt, FaMap } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import Button from "../UI/Button";

export const SideBarAdmin = () => {
    const { logout } = useAuth();

    const navItems = [
        { to: "/admin", icon: FaMapMarkerAlt, label: "Lugares" },
        { to: "/admin/eventos", icon: FaCalendar, label: "Eventos" },
        { to: "/admin/administradores", icon: FaUser, label: "Administradores" },
        { to: "/", icon: FaMap, label: "Ir al mapa" },
    ];

    return (
        <aside className="w-full sm:w-64 bg-[#001A5C] flex flex-col text-white">
            <div className="sm:p-8 flex flex-col items-center">
                <h1 className="text-md font-semibold text-center hidden sm:block">ADMINISTRADOR <br />MAPA CU</h1>
                <img src={logo} alt="Logo UACJ" className="w-[150px] relative z-20 pointer-events-none hidden sm:block" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <nav className="flex flex-row sm:flex-col sm:flex-1 overflow-x-auto sm:overflow-visible justify-between sm:pb-4">

                {navItems.map(({ to, icon: Icon, label }) => (
                    <li key={to} className="list-none sm:w-full flex-shrink-0">
                        <NavLink
                            to={to}
                            end
                            className={({ isActive }) =>
                                `flex flex-row gap-2 cursor-pointer transition-all duration-200 sm:py-4 sm:px-8 py-4 px-4 items-center hover:bg-[#003DA5]/50 justify-center sm:justify-start
                                    ${isActive
                                    ? "bg-[#003DA5]"
                                    : ""
                                }`
                            }
                        >
                            <Icon className="text-xl" />
                            <span className="text-sm">{label}</span>
                        </NavLink>
                    </li>
                ))}


                <li className="hidden sm:list-none sm:flex sm:justify-center sm:mt-auto">
                    <Button
                        onClick={logout}
                        className="flex w-auto flex-row gap-2 cursor-pointer transition-all duration-200 sm:py-4 sm:px-8 py-4 px-4 items-center justify-center sm:justify-start"
                        variant="danger"
                    >
                        <FaSignOutAlt className="text-xl" />
                        <span className="text-sm">Cerrar Sesión</span>
                    </Button>
                </li>
            </nav>
        </aside>
    )
}