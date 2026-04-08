import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl, useMap, Popup } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
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

const iconoRojo = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const iconoAzul = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({
        click: () => onMapClick(),
    });
    return null;
}

interface FlyToTarget {
    lat: number;
    lng: number;
}

function FlyToHandler({ target }: { target: FlyToTarget }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo([target.lat, target.lng], 20, { duration: 1.5 });
    }, [map, target.lat, target.lng]);

    return (
        <Marker position={[target.lat, target.lng]} icon={iconoAzul} />
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

    return (
        <div className="relative h-screen w-full">
            <MapContainer
                center={CU_CENTER}
                zoom={isMobile ? 17 : 18}
                maxZoom={20}
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
                    maxZoom={20}
                />
                <ZoomControl position="bottomright" />

                {puntos.map((punto) => (
                    <Marker
                        key={punto.id}
                        position={[punto.latitud, punto.longitud]}
                    >
                        <Popup minWidth={350}>
                            <SpaceDetailCard
                                espacioId={punto.id}
                                espacioBasic={{
                                    nombre: punto.nombre,
                                    codigo: punto.codigo,
                                    icono: punto.categoria?.icono || "📍"
                                }}
                                onClose={() => { }}
                            />
                        </Popup>
                    </Marker>
                ))}

                <MapClickHandler onMapClick={() => { setSelected(null); clearEspacio(); }} />

                {edificios
                    .filter((e) => e.latitud !== null && e.longitud !== null)
                    .map((edificio) => (
                        <Marker
                            key={edificio.id}
                            position={[edificio.latitud!, edificio.longitud!]}
                            icon={iconoRojo}
                            eventHandlers={{
                                click: () => { setSelected(edificio); clearEspacio(); },
                            }}
                        />
                    ))}

                {flyTarget && <FlyToHandler target={flyTarget} />}
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
