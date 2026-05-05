import { useState } from "react";
import logo from "../../assets/logo_uacj.png";
import { NavLink } from "react-router-dom";
import { FaMapMarkerAlt, FaCalendar, FaUser, FaSignOutAlt, FaMap, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import Button from "../UI/Button";

export const SideBarAdmin = () => {
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { to: "/admin", icon: FaMapMarkerAlt, label: "Lugares" },
        { to: "/admin/eventos", icon: FaCalendar, label: "Eventos" },
        { to: "/admin/administradores", icon: FaUser, label: "Administradores" },
        { to: "/", icon: FaMap, label: "Ir al mapa" },
    ];

    return (
        <>
            {/* Hamburger Button for mobile */}
            <button
                className="sm:hidden fixed top-4 left-4 z-[1002] p-3 bg-white rounded-md shadow-lg text-[#001A5C]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="sm:hidden fixed inset-0 bg-black/50 z-[1000]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed sm:static inset-y-0 left-0 z-[1001] sm:z-50 w-64 bg-[#001A5C] flex flex-col text-white transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 shadow-2xl sm:shadow-none`}>
            <div className="p-8 pt-20 sm:pt-8 flex flex-col items-center">
                <h1 className="text-md font-semibold text-center block">ADMINISTRADOR <br />MAPA CU</h1>
                <img src={logo} alt="Logo UACJ" className="w-[150px] relative z-20 pointer-events-none block mt-4" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <nav className="flex flex-col flex-1 overflow-y-auto pb-4">

                {navItems.map(({ to, icon: Icon, label }) => (
                    <li key={to} className="list-none w-full flex-shrink-0">
                        <NavLink
                            to={to}
                            end
                            className={({ isActive }) =>
                                `flex flex-row gap-2 cursor-pointer transition-all duration-200 py-4 px-8 items-center hover:bg-[#003DA5]/50 justify-start
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


                <li className="list-none flex justify-center mt-auto pb-4">
                    <Button
                        onClick={logout}
                        className="flex w-auto flex-row gap-2 cursor-pointer transition-all duration-200 py-4 px-8 items-center justify-start"
                        variant="danger"
                    >
                        <FaSignOutAlt className="text-xl" />
                        <span className="text-sm">Cerrar Sesión</span>
                    </Button>
                </li>
            </nav>
            </aside>
        </>
    )
}