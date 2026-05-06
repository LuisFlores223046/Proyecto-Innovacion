import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { EspacioCompleto } from "../../types/espacio";
import type { Evento } from "../../types/evento";
import { fetchEspacioDetalle } from "../../services/api";
import StatusBadge from "../UI/StatusBadge";



const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function formatTime(t: string): string {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function estaAbierto(detalle: EspacioCompleto): boolean {
    const ahora = new Date();
    const dia = (ahora.getDay() + 6) % 7;
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    return detalle.horarios.some(
        (h) =>
            h.dia_semana === dia &&
            timeToMinutes(h.hora_apertura) <= horaActual &&
            timeToMinutes(h.hora_cierre) >= horaActual
    );
}

interface Props {
    espacioId: number;
    espacioBasic: { nombre: string; codigo: string; icono?: string };
    onClose: () => void;
}

export default function SpaceDetailCard({ espacioId, espacioBasic, onClose }: Props) {
    const navigate = useNavigate();
    const [detalle, setDetalle] = useState<EspacioCompleto | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);


    useEffect(() => {
        setLoading(true);
        fetchEspacioDetalle(espacioId)
            .then(setDetalle)
            .catch(() => setDetalle(null))
            .finally(() => setLoading(false));
    }, [espacioId]);

    const ahora = new Date();
    const diaActual = (ahora.getDay() + 6) % 7;

    const horariosHoy = detalle?.horarios.filter((h) => h.dia_semana === diaActual) ?? [];
    const abierto = detalle ? estaAbierto(detalle) : false;

    // Detectar foto principal vs galería adicional
    const fotoPrincipal = detalle?.fotos?.find(f => f.es_principal) || detalle?.fotos?.[0];
    const otrasFotos = detalle?.fotos?.filter(f => f.id !== fotoPrincipal?.id) || [];

    return (
        <div
            className={`
                absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]
                w-[92vw] max-w-[400px]
                bg-white border border-gray-200
                rounded-2xl shadow-2xl shadow-black/15
                text-gray-900
                transition-all duration-300 ease-out flex flex-col
                ${expanded ? "max-h-[80vh]" : "max-h-[380px]"}
                overflow-hidden
            `}
        >
            {/* Imagen Principal (si existe) */}
            {!loading && fotoPrincipal && (
                <div 
                    className="w-full h-28 sm:h-32 relative bg-gray-100 shrink-0 cursor-pointer group"
                    onClick={() => setExpandedImage(fotoPrincipal.url)}
                >
                    <img 
                        src={fotoPrincipal.url} 
                        alt="Foto del espacio"
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                        <span className="bg-white/30 text-white p-2 rounded-full backdrop-blur-md">🔍</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-gray-900">
                            {espacioBasic.icono ?? "📍"} {espacioBasic.nombre}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">{espacioBasic.codigo}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {!loading && detalle && (
                            <StatusBadge active={abierto} pulse={abierto} size="sm" />
                        )}
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center
                                       text-gray-500 hover:text-gray-900 hover:bg-gray-200
                                       transition-all duration-200 text-xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Info rápida + botón expandir */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        {detalle?.categoria && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-600">
                                {detalle.categoria.icono} {detalle.categoria.nombre}
                            </span>
                        )}
                        {horariosHoy.length > 0 && (
                            <span className="flex items-center gap-1">
                                🕐 {formatTime(horariosHoy[0].hora_apertura)} – {formatTime(horariosHoy[0].hora_cierre)}
                            </span>
                        )}
                    </div>

                    {!loading && detalle && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700
                                       bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full
                                       transition-all duration-200 font-medium"
                        >
                            {expanded ? "Menos" : "Más info"}
                            <svg
                                className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Contenido expandible */}
            <div
                className={`overflow-y-auto transition-all duration-300 ease-out
                    ${expanded ? "max-h-[50vh] opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="px-4 pb-4 space-y-4">
                    <div className="h-px bg-gray-200" />

                    {detalle?.notas && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                Descripción
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">{detalle.notas}</p>
                        </div>
                    )}

                    {/* Horario semanal */}
                    {detalle && detalle.horarios.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Horarios
                            </h3>
                            <div className="space-y-1">
                                {DIAS.map((dia, i) => {
                                    const horario = detalle.horarios.find((h) => h.dia_semana === i);
                                    const esHoy = i === diaActual;
                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs
                                                ${esHoy ? "bg-blue-50 font-medium" : "bg-gray-50"}`}
                                        >
                                            <span className={esHoy ? "text-blue-700" : "text-gray-600"}>
                                                {dia} {esHoy && "• Hoy"}
                                            </span>
                                            <span className={esHoy ? "text-blue-600" : "text-gray-400"}>
                                                {horario
                                                    ? `${formatTime(horario.hora_apertura)} – ${formatTime(horario.hora_cierre)}`
                                                    : "Cerrado"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Servicios */}
                    {detalle && detalle.servicios.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Servicios
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {detalle.servicios.map((s) => (
                                    <span
                                        key={s.id}
                                        className="px-2 py-1 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-600"
                                    >
                                        {s.descripcion}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contactos */}
                    {detalle && detalle.contactos.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Contacto
                            </h3>
                            <div className="space-y-1.5">
                                {detalle.contactos.map((c) => (
                                    <div key={c.id} className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-400">
                                            {c.tipo === "telefono" ? "📞" : c.tipo === "correo" ? "📧" : "📟"}
                                        </span>
                                        <span className="text-gray-600">{c.valor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ubicación */}
                    {detalle?.latitud && detalle?.longitud && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                Ubicación
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">
                                {detalle.latitud.toFixed(6)}, {detalle.longitud.toFixed(6)}
                            </p>
                        </div>
                    )}

                    {/* Eventos Programados */}
                    {detalle && detalle.eventos && detalle.eventos.length > 0 && (
                        (() => {
                            const eventosActivos = detalle.eventos.filter((e: Evento) => {
                                if (!e.activo) return false;
                                const fechaRef = e.fecha_fin ? new Date(e.fecha_fin) : new Date(e.fecha_inicio);
                                if (!e.fecha_fin) fechaRef.setHours(fechaRef.getHours() + 2);
                                return fechaRef >= new Date();
                            }).sort((a: Evento, b: Evento) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());

                            if (eventosActivos.length === 0) return null;

                            return (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                        Eventos Programados
                                    </h3>
                                    <div className="space-y-2">
                                        {eventosActivos.map((evento: Evento) => {
                                            const fecha = new Date(evento.fecha_inicio);
                                            const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                            
                                            return (
                                                <div 
                                                    key={evento.id}
                                                    onClick={() => navigate('/eventos', { state: { focusEventId: evento.id } })}
                                                    className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50 border border-blue-100 hover:bg-blue-50 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex flex-col items-center justify-center bg-white rounded-md w-10 h-10 shrink-0 border border-blue-200 text-blue-700">
                                                        <span className="text-[10px] font-bold uppercase leading-none">{fecha.toLocaleDateString('es-ES', { month: 'short' })}</span>
                                                        <span className="text-sm font-black leading-none mt-0.5">{fecha.getDate()}</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{evento.titulo}</p>
                                                        <p className="text-xs text-gray-500">{hora}</p>
                                                    </div>
                                                    <div className="text-blue-400 mr-1">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()
                    )}

                    {/* Galería Adicional */}
                    {otrasFotos.length > 0 && (
                        <div className="pt-2">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Más fotos
                            </h3>
                            <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin scrollbar-thumb-gray-300">
                                {otrasFotos.map((foto) => (
                                    <div 
                                        key={foto.id} 
                                        className="w-24 h-24 shrink-0 rounded-lg overflow-hidden snap-center border border-gray-200 cursor-pointer group relative"
                                        onClick={() => setExpandedImage(foto.url)}
                                    >
                                        <img src={foto.url} alt="Galería" className="w-full h-full object-cover transition-opacity group-hover:opacity-90" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                            <span className="bg-white/30 text-white text-xs p-1.5 rounded-full backdrop-blur-md">🔍</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Lightbox de Pantalla Completa */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 z-[2000] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setExpandedImage(null)}
                >
                    <img 
                        src={expandedImage} 
                        alt="Expandida" 
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                    />
                    <button 
                        className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors backdrop-blur-md"
                        onClick={(e) => { e.stopPropagation(); setExpandedImage(null); }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}
