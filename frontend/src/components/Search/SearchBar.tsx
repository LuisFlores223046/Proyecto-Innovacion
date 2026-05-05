import { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { fetchBuscarEspacios } from "../../services/api";
import type { Espacio } from "../../types/espacio";

interface SearchBarProps {
    onSelectResult: (espacio: Espacio) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({ onSelectResult, placeholder = "Buscar lugares...", className = "" }: SearchBarProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedTerm, setDebouncedTerm] = useState("");
    const [results, setResults] = useState<Espacio[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch
    useEffect(() => {
        if (!debouncedTerm.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const data = await fetchBuscarEspacios(debouncedTerm);
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                console.error("Error fetching search results", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedTerm]);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (espacio: Espacio) => {
        setSearchTerm("");
        setIsOpen(false);
        onSelectResult(espacio);
    };

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            <div className="relative flex items-center bg-white rounded-full shadow-md border border-gray-200 px-4 py-3 sm:py-2">
                <FaSearch className="text-gray-400 mr-3" />
                <input
                    type="text"
                    className="w-full bg-transparent outline-none text-gray-700 text-base sm:text-sm"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (e.target.value.trim() !== "") setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                />
            </div>
            
            {/* Dropdown */}
            {isOpen && (searchTerm.trim() !== "") && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Buscando...</div>
                    ) : results.length > 0 ? (
                        <ul className="py-2">
                            {results.map((espacio) => (
                                <li
                                    key={espacio.id}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                                    onClick={() => handleSelect(espacio)}
                                >
                                    <div className="text-xl">{espacio.categoria?.icono || "📍"}</div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{espacio.nombre}</p>
                                        <p className="text-xs text-gray-500">{espacio.codigo}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-sm text-gray-500">No se encontraron resultados</div>
                    )}
                </div>
            )}
        </div>
    );
}
