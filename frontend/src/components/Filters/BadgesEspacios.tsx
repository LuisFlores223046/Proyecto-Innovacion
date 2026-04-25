import { useEffect, useState } from "react";
import type { Categoria } from "../../types/espacio";
import { fetchCategorias } from "../../services/api";

interface Props {
    selectedId: number | null;
    onSelect: (categoria: Categoria | null) => void;
}

export const BadgesEspacios = ({ selectedId, onSelect }: Props) => {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchCategorias()
            .then(setCategorias)
            .catch(() => setCategorias([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="text-sm text-gray-400">Cargando categorias...</div>;
    }

    return (
        <>
            {categorias.map((cat) => {
                const isActive = selectedId === cat.id;
                return (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(isActive ? null : cat)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-all duration-200 cursor-pointer
                            ${isActive
                                ? "bg-[#003DA5] text-white border-[#003DA5] shadow-sm"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <span>{cat.icono}</span>
                        {cat.nombre}
                    </button>
                );
            })}
        </>
    );
};