import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import Button from "../UI/Button";
import type { Evento } from "../../types/evento";
import type { Espacio } from "../../types/espacio";

interface EventCardProps {
    evento: Evento;
    terminado: boolean;
    isFocused: boolean;
    espacioVinculado: Espacio | null;
    eventRef: (el: HTMLDivElement | null) => void;
    onClick: (e: React.MouseEvent) => void;
    onViewOnMap: (espacio: Espacio) => void;
}

export default function EventCard({
    evento,
    terminado,
    isFocused,
    espacioVinculado,
    eventRef,
    onClick,
    onViewOnMap
}: EventCardProps) {

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'academico': return 'bg-blue-100 text-blue-800';
            case 'deportivo': return 'bg-orange-100 text-orange-800';
            case 'cultural': return 'bg-purple-100 text-purple-800';
            case 'administrativo': return 'bg-gray-100 text-gray-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    const formatFecha = (fechaStr: string) => {
        return new Date(fechaStr).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatHora = (fechaStr: string) => {
        return new Date(fechaStr).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            ref={eventRef}
            onClick={onClick}
            className={`
                bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden 
                transition-all duration-300 flex flex-col h-full cursor-pointer
                ${terminado ? 'opacity-60 grayscale-[0.3]' : 'hover:shadow-md hover:-translate-y-1'}
                ${isFocused ? 'ring-4 ring-blue-500/50 shadow-lg' : ''}
            `}
        >
            <div className={`px-6 py-4 border-b border-gray-50 flex justify-between items-start ${terminado ? 'bg-gray-50' : 'bg-white'}`}>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getTipoColor(evento.tipo)}`}>
                    {evento.tipo}
                </span>
                {terminado && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
                        Finalizado
                    </span>
                )}
                {!evento.activo && !terminado && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        Cancelado
                    </span>
                )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                    {evento.titulo}
                </h3>

                {evento.descripcion && (
                    <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                        {evento.descripcion}
                    </p>
                )}

                <div className="mt-auto space-y-3">
                    <div className="flex items-start text-sm text-gray-600 gap-3">
                        <FaCalendarAlt className="mt-0.5 text-gray-400 shrink-0" />
                        <div>
                            <p className="capitalize">{formatFecha(evento.fecha_inicio)}</p>
                        </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 gap-3">
                        <FaClock className="text-gray-400 shrink-0" />
                        <p>
                            {formatHora(evento.fecha_inicio)}
                            {evento.fecha_fin && ` - ${formatHora(evento.fecha_fin)}`}
                        </p>
                    </div>

                    <div className="flex items-start text-sm text-gray-600 gap-3">
                        <FaMapMarkerAlt className="mt-0.5 text-gray-400 shrink-0" />
                        <p className="font-medium text-gray-900">
                            {espacioVinculado ? espacioVinculado.nombre : "Por confirmar / Ubicación externa"}
                        </p>
                    </div>
                </div>
            </div>

            {(evento.url_registro || espacioVinculado) && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                    {evento.url_registro && !terminado && evento.activo && (
                        <Button
                            href={evento.url_registro}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="primary"
                            className="w-full flex items-center justify-center gap-2"
                        >
                            Registrarse <FaExternalLinkAlt className="text-xs" />
                        </Button>
                    )}
                    {espacioVinculado && espacioVinculado.latitud && (
                        <Button
                            onClick={() => onViewOnMap(espacioVinculado)}
                            variant="ghost"
                            className="w-full border border-[#003DA5]  bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            Ver en mapa
                            <FaLocationDot />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
