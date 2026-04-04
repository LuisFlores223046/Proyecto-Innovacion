import { useEffect, useState, useRef } from "react";
import type { Edificio } from "../../types/edificio";
import type { Espacio } from "../../types/espacio";
import { fetchEspaciosPorEdificio } from "../../services/api";

interface Props {
    edificio: Edificio;
    onClose: () => void;
}

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function contarAbiertos(espacios: Espacio[]): number {
    const ahora = new Date();
    const dia = (ahora.getDay() + 6) % 7;
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    return espacios.filter((esp) =>
        (esp as any).horarios?.some(
            (h: any) =>
                h.dia_semana === dia &&
                timeToMinutes(h.hora_apertura) <= horaActual &&
                timeToMinutes(h.hora_cierre) >= horaActual
        )
    ).length;
}

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


export default function BuildingCard({ edificio, onClose }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [espacios, setEspacios] = useState<Espacio[]>([]);
    const [loading, setLoading] = useState(true);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    useEffect(() => {
        setLoading(true);
        fetchEspaciosPorEdificio(edificio.id)
            .then(setEspacios)
            .catch(() => setEspacios([]))
            .finally(() => setLoading(false));
    }, [edificio.id]);

    const abiertos = contarAbiertos(espacios);
    const hayAbiertos = abiertos > 0;
    const totalEspacios = espacios.length;

    const ahora = new Date();
    const diaActual = (ahora.getDay() + 6) % 7;
    const horariosHoy = espacios.flatMap((esp: any) =>
        (esp.horarios ?? []).filter((h: any) => h.dia_semana === diaActual)
    );
    const horaMin = horariosHoy.length
        ? horariosHoy.reduce((min: string, h: any) => (h.hora_apertura < min ? h.hora_apertura : min), horariosHoy[0].hora_apertura)
        : null;
    const horaMax = horariosHoy.length
        ? horariosHoy.reduce((max: string, h: any) => (h.hora_cierre > max ? h.hora_cierre : max), horariosHoy[0].hora_cierre)
        : null;

    const serviciosUnicos = [
        ...new Set(
            espacios.flatMap((esp: any) =>
                (esp.servicios ?? []).map((s: any) => s.descripcion)
            )
        ),
    ];

    const categoriasUnicas = [
        ...new Map(
            espacios
                .filter((e) => e.categoria)
                .map((e) => [e.categoria!.id, e.categoria!])
        ).values(),
    ];

    return (
        <div
            ref={cardRef}
            className={`
                absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]
                w-[92vw] max-w-[400px]
                bg-white backdrop-blur-xl
                border border-gray-200
                rounded-2xl shadow-2xl shadow-black/15
                text-gray-900
                transition-all duration-300 ease-out
                ${expanded ? "max-h-[80vh]" : "max-h-[220px]"}
                overflow-hidden
            `}
        >
            <div className="relative">
                {edificio.foto_url ? (
                    <img
                        src={edificio.foto_url}
                        alt={edificio.nombre}
                        className={`w-full object-cover transition-all duration-300 ${expanded ? "h-44" : "h-28"
                            }`}
                    />
                ) : (
                    <div
                        className={`w-full flex bg-gray-200 items-center justify-center transition-all duration-300 ${expanded ? "h-44" : "h-28"
                            }`}
                    >
                        <span className="text-4xl">🏛️</span>
                    </div>
                )}

                {/* <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" /> */}

                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm
                               flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white
                               transition-all duration-200 text-sm shadow-sm"
                >
                    ✕
                </button>

                {!loading && (
                    <div className="absolute top-2 left-2">
                        <span
                            className={`
                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                backdrop-blur-sm shadow-lg
                                ${hayAbiertos
                                    ? "bg-emerald-500/20 text-emerald-700 border border-emerald-400/30"
                                    : "bg-red-500/20 text-red-700 border border-red-400/30"
                                }
                            `}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${hayAbiertos ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                            {hayAbiertos ? "Abierto" : "Cerrado"}
                        </span>
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                    <h2 className="text-lg font-bold leading-tight drop-shadow-lg">
                        {edificio.nombre}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">{edificio.codigo}</p>
                </div>
            </div>

            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        {!loading && (
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {totalEspacios} espacio{totalEspacios !== 1 && "s"}
                            </span>
                        )}

                        {horaMin && horaMax && (
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatTime(horaMin)} – {formatTime(horaMax)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700
                                   bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full
                                   transition-all duration-200 font-medium"
                    >
                        {expanded ? "Menos" : "Más info"}
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div
                className={`
                    overflow-y-auto transition-all duration-300 ease-out
                    ${expanded ? "max-h-[50vh] opacity-100" : "max-h-0 opacity-0"}
                `}
            >
                <div className="px-4 pb-4 space-y-4">
                    <div className="h-px bg-gray-200" />

                    {edificio.descripcion && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                Descripción
                            </h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {edificio.descripcion}
                            </p>
                        </div>
                    )}

                    {categoriasUnicas.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Tipos de espacios
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {categoriasUnicas.map((cat) => (
                                    <span
                                        key={cat.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                                                   bg-gray-50 border border-gray-200 text-gray-600"
                                        style={{ borderColor: cat.color_hex + "40" }}
                                    >
                                        <span>{cat.icono}</span>
                                        {cat.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {horariosHoy.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                Horario de hoy ({DIAS[diaActual]})
                            </h3>
                            <div className="grid grid-cols-2 gap-1.5">
                                {espacios
                                    .filter((esp: any) =>
                                        (esp as any).horarios?.some((h: any) => h.dia_semana === diaActual)
                                    )
                                    .slice(0, 6)
                                    .map((esp: any) => {
                                        const horario = esp.horarios?.find(
                                            (h: any) => h.dia_semana === diaActual
                                        );
                                        if (!horario) return null;
                                        return (
                                            <div
                                                key={esp.id}
                                                className="flex items-center justify-between px-2 py-1.5
                                                           bg-gray-50 rounded-lg text-xs"
                                            >
                                                <span className="text-gray-600 truncate max-w-[60%]">
                                                    {esp.categoria?.icono ?? "📍"} {esp.nombre}
                                                </span>
                                                <span className="text-gray-400">
                                                    {formatTime(horario.hora_apertura)}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {serviciosUnicos.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                Servicios disponibles
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {serviciosUnicos.slice(0, 10).map((s) => (
                                    <span
                                        key={s}
                                        className="px-2 py-1 rounded-lg text-xs bg-gray-50 border border-gray-200 text-gray-600"
                                    >
                                        {s}
                                    </span>
                                ))}
                                {serviciosUnicos.length > 10 && (
                                    <span className="px-2 py-1 rounded-lg text-xs bg-gray-50 text-gray-400">
                                        +{serviciosUnicos.length - 10} más
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {edificio.latitud && edificio.longitud && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                Ubicación
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">
                                {edificio.latitud.toFixed(6)}, {edificio.longitud.toFixed(6)}
                            </p>
                        </div>
                    )}

                    {!loading && totalEspacios > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                Estado de espacios
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                        style={{ width: `${(abiertos / totalEspacios) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">
                                    {abiertos}/{totalEspacios} abiertos
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
