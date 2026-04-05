import { useNavigate } from "react-router-dom";
import type { Espacio } from "../../types/espacio";
import { FaLocationDot } from "react-icons/fa6";
import Button from "../UI/Button";

interface Props {
    espacio: Espacio;
}

export default function EspacioCard({ espacio }: Props) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (espacio.latitud && espacio.longitud) {
            navigate("/", {
                state: {
                    flyTo: { lat: espacio.latitud, lng: espacio.longitud },
                    espacio: espacio,
                },
            });
        }
    };

    const tieneUbicacion = espacio.latitud && espacio.longitud;

    return (
        <div
            onClick={handleClick}
            className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200
                ${tieneUbicacion ? "cursor-pointer" : "cursor-default"}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {espacio.categoria?.icono ?? "📍"} {espacio.nombre}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{espacio.codigo}</p>
                </div>
            </div>

            {espacio.notas && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {espacio.notas}
                </p>
            )}

            <div className="flex items-center justify-between gap-3 mt-3">
                {espacio.categoria && (
                    <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-gray-50 border border-gray-200 text-gray-600"
                    >
                        {espacio.categoria.icono} {espacio.categoria.nombre}
                    </span>
                )}
                {tieneUbicacion && (
                    <Button
                        onClick={handleClick}
                        className="text-white flex items-center gap-0.5 text-xs "
                    >
                        <FaLocationDot />
                        Ver en mapa
                    </Button>
                )}
            </div>
        </div>
    );
}
