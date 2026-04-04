import { NavLink } from "react-router-dom";
import { FaMap, FaCalendar, FaSearch } from "react-icons/fa";

const navItems = [
    { to: "/", icon: FaMap, label: "Mapa" },
    { to: "/eventos", icon: FaCalendar, label: "Eventos" },
    { to: "/buscar", icon: FaSearch, label: "Buscar" },
];

export const SideBar = () => {
    return (
        <aside className="bg-white text-[#003DA5] w-fit h-screen flex flex-col px-4 pt-20">
            <ul className="flex flex-col gap-6">
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