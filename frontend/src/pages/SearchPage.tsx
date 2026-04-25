import { useState, useEffect } from "react";
import { BadgesEspacios } from "../components/Filters/BadgesEspacios";
import EspacioCard from "../components/LocationCard/EspacioCard";
import { fetchEspaciosPorCategoria, fetchTodosLosEspacios } from "../services/api";
import type { Categoria, Espacio } from "../types/espacio";
import SearchBar from "../components/Search/SearchBar";
import { useNavigate } from "react-router-dom";

export default function SearchPage() {
    const [selectedCat, setSelectedCat] = useState<Categoria | null>(null);
    const [espacios, setEspacios] = useState<Espacio[]>([]);
    const [loading, setLoading] = useState(false);
    const [destacados, setDestacados] = useState<Espacio[]>([]);
    const [loadingDestacados, setLoadingDestacados] = useState(true);
    const navigate = useNavigate();

    const handleSearchSelect = (espacio: Espacio) => {
        navigate("/", { state: { flyTo: { lat: espacio.latitud, lng: espacio.longitud }, espacio } });
    };

    useEffect(() => {
        setLoadingDestacados(true);
        fetchTodosLosEspacios(["Aula", "Bano Mujeres", "Bano Hombres", "Baño Mujeres", "Baño Hombres"])
            .then((data) => {
                // Seleccionar 6 espacios al azar
                const shuffled = [...data].sort(() => 0.5 - Math.random());
                setDestacados(shuffled.slice(0, 6));
            })
            .catch(() => setDestacados([]))
            .finally(() => setLoadingDestacados(false));
    }, []);

    useEffect(() => {
        if (!selectedCat) {
            setEspacios([]);
            return;
        }

        setLoading(true);
        fetchEspaciosPorCategoria(selectedCat.id)
            .then(setEspacios)
            .catch(() => setEspacios([]))
            .finally(() => setLoading(false));
    }, [selectedCat]);

    return (
        <div className="p-6">
            <div className="mb-8 relative z-[1000]">
                <SearchBar onSelectResult={handleSearchSelect} placeholder="Buscar por nombre o código..." className="max-w-xl" />
            </div>

            <h1 className="text-2xl font-semibold mb-2">Categorías</h1>
            <div className="flex flex-wrap gap-2">
                <BadgesEspacios
                    selectedId={selectedCat?.id ?? null}
                    onSelect={setSelectedCat}
                />
            </div>

            {selectedCat ? (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        {selectedCat.icono} {selectedCat.nombre}
                        {!loading && (
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                ({espacios.length} resultado{espacios.length !== 1 && "s"})
                            </span>
                        )}
                    </h2>

                    {loading ? (
                        <div className="text-sm text-gray-400">Cargando espacios...</div>
                    ) : espacios.length === 0 ? (
                        <div className="text-sm text-gray-400">No se encontraron espacios en esta categoría.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {espacios.map((espacio) => (
                                <EspacioCard key={espacio.id} espacio={espacio} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="mt-10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        ✨ Te podría interesar
                    </h2>
                    {loadingDestacados ? (
                        <div className="text-sm text-gray-400">Cargando sugerencias...</div>
                    ) : destacados.length === 0 ? (
                        <div className="text-sm text-gray-400">No hay sugerencias disponibles.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {destacados.map((espacio) => (
                                <EspacioCard key={espacio.id} espacio={espacio} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
