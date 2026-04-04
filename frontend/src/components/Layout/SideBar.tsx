import { NavLink } from "react-router-dom";
import { FaMap, FaCalendar, FaSearch } from "react-icons/fa";

const navItems = [
    { to: "/", icon: FaMap, label: "Mapa" },
    { to: "/eventos", icon: FaCalendar, label: "Eventos" },
    { to: "/buscar", icon: FaSearch, label: "Buscar" },
];

export const SideBar = () => {
    return (
        <aside className="bg-white text-[#003DA5] w-full sm:w-fit sm:h-screen h-fit px-4 sm:pt-20 py-4">
            <ul className="flex flex-row sm:flex-col justify-around sm:justify-start gap-6">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <li key={to}>
                        <NavLink
                            to={to}
                            end
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-2 cursor-pointer transition-all duration-200
                                ${isActive
                                    ? "text-[#003DA5] font-semibold scale-110"
                                    : "text-gray-500 hover:text-[#003DA5]"
                                }`
                            }
                        >
                            <Icon className="text-xl" />
                            <span className="text-xs">{label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};