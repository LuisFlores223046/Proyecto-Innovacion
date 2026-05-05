interface Props {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
    pulse?: boolean;
    size?: "sm" | "md";
}

export default function StatusBadge({
    active,
    activeLabel = "Abierto",
    inactiveLabel = "Cerrado",
    pulse = false,
    size = "md",
}: Props) {
    const sizeClasses = size === "sm"
        ? "px-2 py-0.5 text-[10px]"
        : "px-2.5 py-1 text-xs";

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold
                backdrop-blur-sm shadow-sm border
                ${sizeClasses}
                ${active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full
                    ${active ? "bg-emerald-400" : "bg-red-400"}
                    ${active && pulse ? "animate-pulse" : ""}`}
            />
            {active ? activeLabel : inactiveLabel}
        </span>
    );
}
