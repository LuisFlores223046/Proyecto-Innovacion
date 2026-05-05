import { useEffect } from "react";
import { useMapEvents, useMap, Marker } from "react-leaflet";
import type { LatLngBounds } from "leaflet";
import L from "leaflet";
import type { JSX } from "react";

export function MapClickHandler({ onMapClick }: { onMapClick: () => void }): null {
    useMapEvents({
        click: () => onMapClick(),
    });
    return null;
}

export function ZoomWatcher({ onViewChange }: {
    onViewChange: (zoom: number, bounds: LatLngBounds) => void;
}): null {
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

export interface FlyToTarget {
    lat: number;
    lng: number;
}

export function FlyToHandler({ target, icon }: { target: FlyToTarget, icon: L.DivIcon | L.Icon }): JSX.Element {
    const map = useMap();

    useEffect(() => {
        map.flyTo([target.lat, target.lng], 20, { duration: 1.5 });
    }, [map, target.lat, target.lng]);

    return (
        <Marker
            position={[target.lat, target.lng]}
            icon={icon}
            eventHandlers={{
                click: () => {
                    // Un handler vacío evita que el click se propague al mapa
                    // y cierre accidentalmente la tarjeta de detalle.
                }
            }}
        />
    );
}
