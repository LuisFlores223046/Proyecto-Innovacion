import { useState, useRef } from "react";
import Button from "../../UI/Button";
import { toast } from "sonner";
import { subirFoto, eliminarFoto, editarFoto } from "../../../services/api";
import type { Foto } from "../../../types/espacio";

interface Props {
  espacioId: number;
  fotos: Foto[];
  onUpdate: () => void;
}

export default function FotosManager({ espacioId, fotos, onUpdate }: Props) {
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [fotoEsPrincipal, setFotoEsPrincipal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivoFoto(e.target.files[0]);
    }
  };

  const handleSubir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoFoto) {
      toast.error("Selecciona una imagen primero");
      return;
    }
    try {
      setIsUploading(true);

      if (fotoEsPrincipal && fotos) {
        const fotosPrincipalesAnteriores = fotos.filter(f => f.es_principal);
        for (const fotoVieja of fotosPrincipalesAnteriores) {
          await editarFoto(fotoVieja.id, { es_principal: false });
        }
      }

      await subirFoto(espacioId, archivoFoto, fotoEsPrincipal);
      toast.success("Foto subida exitosamente");
      setArchivoFoto(null);
      setFotoEsPrincipal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarFoto(id);
      toast.success("Foto eliminada");
      onUpdate();
    } catch (error) { console.error(error); }
  };

  return (
    <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Galería de Fotos</h3>
      <form onSubmit={handleSubir} className="flex flex-col gap-4 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <input
            type="file"
            accept="image/*"
            onChange={handleArchivoChange}
            ref={fileInputRef}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cb-principal"
              checked={fotoEsPrincipal}
              onChange={(e) => setFotoEsPrincipal(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="cb-principal" className="text-sm text-gray-700 select-none cursor-pointer">Definir como Principal</label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isUploading || !archivoFoto}>
            {isUploading ? "Subiendo..." : "Añadir a Galería"}
          </Button>
        </div>
      </form>

      <div className="mt-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Fotos Registradas ({fotos.length})</h4>
        {fotos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay fotos todavía.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {fotos.map(foto => (
              <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100 shadow-sm">
                <img src={foto.url} alt="Lugar" className="w-full h-full object-cover" />
                {foto.es_principal && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-md shadow-md font-bold uppercase">
                    Principal
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                  <button
                    onClick={() => handleEliminar(foto.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600 transform transition-transform scale-90 group-hover:scale-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
