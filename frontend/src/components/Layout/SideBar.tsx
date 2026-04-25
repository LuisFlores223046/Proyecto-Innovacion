import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaMap, FaCalendar, FaSearch, FaUserEdit, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

const navItems = [
    { to: "/", icon: FaMap, label: "Mapa" },
    { to: "/eventos", icon: FaCalendar, label: "Eventos" },
    { to: "/buscar", icon: FaSearch, label: "Buscar" },
    // { to: "/admin", icon: FaUserEdit, label: "Admin" },
];

export const SideBar = () => {
    const { isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Hamburger Button */}
            <button
                className="sm:hidden fixed top-4 left-4 z-[1002] p-3 bg-white rounded-md shadow-lg text-[#003DA5]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="sm:hidden fixed inset-0 bg-black/50 z-[1000]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed sm:static inset-y-0 left-0 z-[1001] sm:z-50 bg-white text-[#003DA5] w-64 sm:w-fit h-full sm:h-screen px-4 pt-20 sm:pt-20 py-4 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 shadow-xl sm:shadow-none`}>
                <ul className="flex flex-col justify-start gap-8">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            end
                            className={({ isActive }) =>
                                `flex flex-row sm:flex-col items-center gap-4 sm:gap-2 cursor-pointer transition-all duration-200
                                ${isActive
                                    ? "text-[#003DA5] font-semibold sm:scale-110"
                                    : "text-gray-500 hover:text-[#003DA5]"
                                }`
                            }
                        >
                            <Icon className="text-xl" />
                            <span className="text-sm sm:text-xs">{label}</span>
                        </NavLink>
                    </li>
                ))}
                {isAuthenticated && (
                    <li>
                        <NavLink
                            to="/admin"
                            end
                            className={({ isActive }) =>
                                `flex flex-row sm:flex-col items-center gap-4 sm:gap-2 cursor-pointer transition-all duration-200
                                ${isActive
                                    ? "text-[#003DA5] font-semibold sm:scale-110"
                                    : "text-gray-500 hover:text-[#003DA5]"
                                }`
                            }
                        >
                            <FaUserEdit className="text-xl" />
                            <span className="text-sm sm:text-xs">Admin</span>
                        </NavLink>
                    </li>
                )}
            </ul>
            </aside>
        </>
    );
};