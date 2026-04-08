import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression, LatLngBounds } from "leaflet";
import L from "leaflet";
import type { JSX } from "react";
import type { Edificio } from "../types/edificio";
import type { Espacio } from "../types/espacio";
import { fetchEdificios } from "../services/api";
import BuildingCard from "../components/LocationCard/BuildingCard";
import SpaceDetailCard from "../components/LocationCard/SpaceDetailCard";
import { useLocation } from "react-router-dom";
import { fetchTodosLosEspacios } from "../services/api";
import "leaflet/dist/leaflet.css"

const CU_CENTER: LatLngExpression = [31.49261, -106.41446];

const CU_BOUNDS: LatLngBoundsExpression = [
    [31.498198447766526, -106.409644733004],
    [31.48653567027508, -106.42205879769486],
];

const urlTile =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const createBuildingIcon = (codigo: string) => {
    return L.divIcon({
        className: 'custom-building-marker bg-transparent border-none',
        html: `<div style="width: 36px; height: 48px; transition: transform 0.2s; transform-origin: bottom center;">
            <svg viewBox="0 0 36 48" width="36" height="48" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 4px rgba(0,0,0,0.25)); overflow: visible;">
              <path d="M18 0C8.06 0 0 8.06 0 18c0 12.33 16.53 28.92 17.11 29.5a1.2 1.2 0 0 0 1.78 0C19.47 46.92 36 30.33 36 18 36 8.06 27.94 0 18 0z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
              <text x="18" y="23" font-family="sans-serif" font-size="14px" fill="white" font-weight="bold" text-anchor="middle">${codigo}</text>
            </svg>
        </div>`,
        iconSize: [36, 48],
        iconAnchor: [18, 48],
    });
};

const iconoAzul = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const createEmojiIcon = (emoji: string, colorHex: string, isPulsing: boolean = false) => {
    return L.divIcon({
        className: 'custom-emoji-marker bg-transparent border-none',
        html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            ${isPulsing ? `<div class="animate-ping" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${colorHex};"></div>` : ''}
            <div style="
                background-color: ${colorHex};
                border: 2px solid #ffffff;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                position: relative;
                z-index: 10;
                transition: transform 0.2s;
            ">${emoji}</div>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    });
};

const ZOOM_THRESHOLD_ESPACIOS = 19;

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({
        click: () => onMapClick(),
    });
    return null;
}

function ZoomWatcher({ onViewChange }: {
    onViewChange: (zoom: number, bounds: LatLngBounds) => void;
}) {
    const map = useMap();

    useEffect(() => {
        // Estado inicial
        onViewChange(map.getZoom(), map.getBounds());
    }, [map, onViewChange]);

    useMapEvents({
        zoomend: () => onViewChange(map.getZoom(), map.getBounds()),
        moveend: () => onViewChange(map.getZoom(), map.getBounds()),
    });

    return null;
}

interface FlyToTarget {
    lat: number;
    lng: number;
}

function FlyToHandler({ target, icon }: { target: FlyToTarget, icon: L.DivIcon | L.Icon }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo([target.lat, target.lng], 20, { duration: 1.5 });
    }, [map, target.lat, target.lng]);

    return (
        <Marker position={[target.lat, target.lng]} icon={icon} />
    );
}

interface LocationState {
    flyTo?: FlyToTarget;
    espacio?: Espacio;
}

export default function MapPage(): JSX.Element {
    const [edificios, setEdificios] = useState<Edificio[]>([]);
    const [selected, setSelected] = useState<Edificio | null>(null);
    const location = useLocation();

    const flyToState = location.state as LocationState | null;
    const [flyTarget, setFlyTarget] = useState<FlyToTarget | null>(null);
    const [espacioDetalle, setEspacioDetalle] = useState<Espacio | null>(null);
    const [puntos, setPuntos] = useState<any[]>([]);

    // Estado del viewport del mapa
    const [zoomLevel, setZoomLevel] = useState<number>(18);
    const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);

    const handleViewChange = useCallback((zoom: number, bounds: LatLngBounds) => {
        setZoomLevel(zoom);
        setMapBounds(bounds);
    }, []);

    useEffect(() => {
        fetchTodosLosEspacios()
            .then(data => setPuntos(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        fetchEdificios()
            .then((data: Edificio[]) => setEdificios(data))
            .catch((err) => console.error("Error cargando edificios:", err));
    }, []);

    useEffect(() => {
        if (flyToState?.flyTo) {
            setFlyTarget(flyToState.flyTo);
            setEspacioDetalle(flyToState.espacio ?? null);
            setSelected(null);
            window.history.replaceState({}, "");
        }
    }, [flyToState]);

    const clearEspacio = () => {
        setFlyTarget(null);
        setEspacioDetalle(null);
    };

    const isMobile = window.innerWidth < 640;

    const showEspacios = zoomLevel >= ZOOM_THRESHOLD_ESPACIOS;
    const puntosVisibles = showEspacios && mapBounds
        ? puntos.filter((p) =>
            p.latitud != null &&
            p.longitud != null &&
            mapBounds.contains([p.latitud, p.longitud])
        )
        : [];

    return (
        <div className="relative h-screen w-full">
            <MapContainer
                center={CU_CENTER}
                zoom={isMobile ? 17 : 18}
                maxZoom={21}
                zoomAnimation={true}
                minZoom={16}
                scrollWheelZoom={true}
                className="h-full w-full"
                maxBounds={CU_BOUNDS}
                maxBoundsViscosity={1}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url={urlTile}
                    maxNativeZoom={19}
                    maxZoom={21}
                />
                <ZoomControl position="bottomright" />

                <ZoomWatcher onViewChange={handleViewChange} />

                {puntosVisibles.map((punto) => (
                    <Marker
                        key={punto.id}
                        position={[punto.latitud, punto.longitud]}
                        icon={createEmojiIcon(
                            punto.categoria?.icono || "📍",
                            punto.categoria?.color_hex || "#3b82f6"
                        )}
                        eventHandlers={{
                            click: () => {
                                setSelected(null);
                                setEspacioDetalle(punto);
                                setFlyTarget(null);
                            },
                        }}
                    />
                ))}

                <MapClickHandler onMapClick={() => { setSelected(null); clearEspacio(); }} />

                {edificios
                    .filter((e) => e.latitud !== null && e.longitud !== null)
                    .map((edificio) => (
                        <Marker
                            key={edificio.id}
                            position={[edificio.latitud!, edificio.longitud!]}
                            icon={createBuildingIcon(edificio.codigo)}
                            eventHandlers={{
                                click: () => { setSelected(edificio); clearEspacio(); },
                            }}
                        />
                    ))}

                {flyTarget && (
                    <FlyToHandler
                        target={flyTarget}
                        icon={espacioDetalle
                            ? createEmojiIcon(espacioDetalle.categoria?.icono || "📍", espacioDetalle.categoria?.color_hex || "#3b82f6", true)
                            : iconoAzul
                        }
                    />
                )}
            </MapContainer>

            {selected && (
                <BuildingCard
                    edificio={selected}
                    onClose={() => setSelected(null)}
                />
            )}

            {espacioDetalle && (
                <SpaceDetailCard
                    espacioId={espacioDetalle.id}
                    espacioBasic={{
                        nombre: espacioDetalle.nombre,
                        codigo: espacioDetalle.codigo,
                        icono: espacioDetalle.categoria?.icono,
                    }}
                    onClose={clearEspacio}
                />
            )}
        </div>
    );
}
