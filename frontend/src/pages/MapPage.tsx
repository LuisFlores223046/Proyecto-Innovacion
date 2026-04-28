import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import type { LatLngExpression, LatLngBounds } from "leaflet";
import type { JSX } from "react";
import type { Edificio } from "../types/edificio";
import type { Espacio } from "../types/espacio";
import { fetchEdificios, fetchTodosLosEspacios } from "../services/api";
import BuildingCard from "../components/LocationCard/BuildingCard";
import SpaceDetailCard from "../components/LocationCard/SpaceDetailCard";
import { useLocation } from "react-router-dom";
import SearchBar from "../components/Search/SearchBar";
import "leaflet/dist/leaflet.css"

import { CU_CENTER, CU_BOUNDS, urlTile, ZOOM_THRESHOLD_ESPACIOS } from "../components/Map/mapConfig";
import { createBuildingIcon, createEmojiIcon, createUserLocationIcon } from "../components/Map/mapIcons";
import { MapClickHandler, ZoomWatcher, FlyToHandler, type FlyToTarget } from "../components/Map/MapEventHandlers";

interface LocationState {
    flyTo?: FlyToTarget;
    espacio?: Espacio;
}

export default function MapPage(): JSX.Element {
    const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
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

    useEffect(() => {
        if (!navigator.geolocation) {
            console.warn("La geolocalización no está soportada por tu navegador");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
            },
            (error) => {
                console.error("Error obteniendo ubicación:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const handleViewChange = useCallback((zoom: number, bounds: LatLngBounds) => {
        setZoomLevel(zoom);
        setMapBounds(bounds);
    }, []);

    useEffect(() => {
        fetchTodosLosEspacios(["Aula", "Baño Mujeres", "Baño Hombres"])
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

    const handleSearchSelect = (espacio: Espacio) => {
        setSelected(null);
        setEspacioDetalle(espacio);
        if (espacio.latitud && espacio.longitud) {
            setFlyTarget({ lat: espacio.latitud, lng: espacio.longitud });
        }
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
            <div className="absolute top-4 left-[72px] right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[400px] z-[1000] pointer-events-auto">
                <SearchBar onSelectResult={handleSearchSelect} />
            </div>

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
                            : createEmojiIcon("📍", "#3b82f6")
                        }
                    />
                )}

                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={createUserLocationIcon()}
                        eventHandlers={{ click: () => { } }} // handler vacío para evitar propagación al mapa
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
