import { useEffect, useState } from "react";
import type { EspacioCompleto } from "../../types/espacio";
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
    const [detalle, setDetalle] = useState<EspacioCompleto | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

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

    return (
        <div
            className={`
                absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]
                w-[92vw] max-w-[400px]
                bg-white border border-gray-200
                rounded-2xl shadow-2xl shadow-black/15
                text-gray-900
                transition-all duration-300 ease-out
                ${expanded ? "max-h-[80vh]" : "max-h-[200px]"}
                overflow-hidden
            `}
        >
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
                </div>
            </div>
        </div>
    );
}
