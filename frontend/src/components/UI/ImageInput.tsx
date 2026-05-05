import { type JSX, type InputHTMLAttributes } from "react";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    handleUploadFoto?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleDeleteFoto?: () => void;
    isUploadingFoto?: boolean;
    fotoUrl?: string | null;
    entityId?: number;
    entityName?: string;
}

export default function ImageInput({
    handleUploadFoto,
    handleDeleteFoto,
    isUploadingFoto,
    fotoUrl,
    entityId,
    entityName = "Elemento"
}: Props): JSX.Element {
    return (
        <section className={`relative transition-all duration-300 ${!entityId ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {!entityId && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-2xl">
                    <span className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                        Bloqueado: Guarda primero el {entityName.toLowerCase()}
                    </span>
                </div>
            )}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    Foto del {entityName}
                </h3>

                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 min-h-[150px]">
                    {fotoUrl ? (
                        <div className="relative group w-full h-40">
                            <img
                                src={fotoUrl}
                                alt={entityName}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                <button
                                    type="button"
                                    onClick={handleDeleteFoto}
                                    className="bg-red-500 text-white p-2 rounded-full hover:scale-110 transition-transform"
                                    title="Eliminar foto"
                                >
                                    <FaTrash size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label htmlFor="foto-upload-input" className="flex flex-col items-center gap-3 cursor-pointer hover:text-blue-500 transition-colors">
                            <FaCloudUploadAlt size={40} className="text-gray-300" />
                            <span className="text-sm text-gray-500 text-center">
                                {isUploadingFoto ? "Subiendo..." : `Subir foto del ${entityName.toLowerCase()}`}
                            </span>
                            <input
                                id="foto-upload-input"
                                type="file"
                                className="hidden"
                                onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                onChange={handleUploadFoto}
                                accept="image/*"
                                disabled={isUploadingFoto}
                            />
                        </label>
                    )}
                </div>
            </div>
        </section>
    )
}