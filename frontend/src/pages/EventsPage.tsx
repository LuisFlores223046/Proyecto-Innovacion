import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchEventos, fetchTodosLosEspacios } from "../services/api";
import type { Evento } from "../types/evento";
import type { Espacio } from "../types/espacio";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaExternalLinkAlt } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import EventCard from "../components/Events/EventCard";
import Modal from "../components/UI/Modal";
import Button from "../components/UI/Button";

export default function EventsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [focusedId, setFocusedId] = useState<number | null>(location.state?.focusEventId || null);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [espaciosMap, setEspaciosMap] = useState<Record<number, Espacio>>({});
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);

    const eventRefs = useRef<Record<number, HTMLDivElement | null>>({});

    useEffect(() => {
        async function loadData() {
            try {
                const [eventosData, espaciosData] = await Promise.all([
                    fetchEventos(),
                    fetchTodosLosEspacios()
                ]);

                const map: Record<number, Espacio> = {};
                espaciosData.forEach(esp => {
                    map[esp.id] = esp;
                });

                setEspaciosMap(map);
                setEventos(eventosData);
            } catch (error) {
                console.error("Error cargando la página de eventos:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    useEffect(() => {
        if (!loading && focusedId && eventRefs.current[focusedId]) {
            setTimeout(() => {
                eventRefs.current[focusedId]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }, 100);
        }
    }, [loading, focusedId]);

    const isFinished = (evento: Evento) => {
        const fechaReferencia = evento.fecha_fin ? new Date(evento.fecha_fin) : new Date(evento.fecha_inicio);
        if (!evento.fecha_fin) {
            fechaReferencia.setHours(fechaReferencia.getHours() + 2);
        }
        return fechaReferencia < new Date();
    };

    const handleViewOnMap = (espacio: Espacio) => {
        if (espacio.latitud && espacio.longitud) {
            navigate('/', {
                state: {
                    flyTo: { lat: espacio.latitud, lng: espacio.longitud },
                    espacio: espacio
                }
            });
        }
    };

    const sortedEventos = [...eventos].sort((a, b) => {
        const aFin = isFinished(a);
        const bFin = isFinished(b);
        if (aFin && !bFin) return 1;
        if (!aFin && bFin) return -1;
        return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime();
    });

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8"
            onClick={() => setFocusedId(null)}
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl text-[#003DA5]">
                        Eventos en la Institución
                    </h1>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                        Descubre todo lo que está sucediendo en nuestro campus.
                    </p>
                </div>

                {sortedEventos.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Actualmente no hay eventos programados.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {sortedEventos.map((evento) => (
                            <EventCard
                                key={evento.id}
                                evento={evento}
                                terminado={isFinished(evento)}
                                isFocused={focusedId === evento.id}
                                espacioVinculado={evento.espacio_id ? espaciosMap[evento.espacio_id] : null}
                                eventRef={(el) => { eventRefs.current[evento.id] = el; }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(evento);
                                }}
                                onViewOnMap={handleViewOnMap}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para Detalles del Evento */}
            <Modal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                title={selectedEvent?.titulo || "Detalles del Evento"}
            >
                {selectedEvent && (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize bg-blue-100 text-blue-800">
                                {selectedEvent.tipo}
                            </span>
                            {isFinished(selectedEvent) && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-200 text-gray-700">
                                    Finalizado
                                </span>
                            )}
                            {!selectedEvent.activo && !isFinished(selectedEvent) && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                                    Cancelado
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {selectedEvent.descripcion || "Sin descripción disponible."}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                            <div className="flex items-start text-gray-700 gap-3">
                                <FaCalendarAlt className="mt-1 text-blue-500 shrink-0 text-lg" />
                                <div>
                                    <p className="font-medium text-gray-900 capitalize">
                                        {formatFecha(selectedEvent.fecha_inicio)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center text-gray-700 gap-3">
                                <FaClock className="text-blue-500 shrink-0 text-lg" />
                                <p className="font-medium text-gray-900">
                                    {formatHora(selectedEvent.fecha_inicio)}
                                    {selectedEvent.fecha_fin && ` - ${formatHora(selectedEvent.fecha_fin)}`}
                                </p>
                            </div>

                            <div className="flex items-start text-gray-700 gap-3">
                                <FaMapMarkerAlt className="mt-1 text-blue-500 shrink-0 text-lg" />
                                <p className="font-medium text-gray-900">
                                    {selectedEvent.espacio_id && espaciosMap[selectedEvent.espacio_id]
                                        ? espaciosMap[selectedEvent.espacio_id].nombre
                                        : "Por confirmar / Externa"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
                            {selectedEvent.url_registro && !isFinished(selectedEvent) && selectedEvent.activo && (
                                <Button
                                    href={selectedEvent.url_registro}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="primary"
                                    className="w-full sm:flex-1 flex items-center justify-center gap-2"
                                >
                                    Registrarse <FaExternalLinkAlt className="text-sm" />
                                </Button>
                            )}
                            {selectedEvent.espacio_id && espaciosMap[selectedEvent.espacio_id]?.latitud && (
                                <Button
                                    onClick={() => {
                                        const espacio = espaciosMap[selectedEvent.espacio_id!];
                                        if (espacio) {
                                            handleViewOnMap(espacio);
                                        }
                                    }}
                                    variant="ghost"
                                    className="w-full sm:flex-1 flex items-center justify-center gap-2 border border-[#003DA5]"
                                >
                                    Ver en mapa <FaLocationDot className="text-sm" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}