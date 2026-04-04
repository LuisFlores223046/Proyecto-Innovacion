import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, ZoomControl } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import L from "leaflet";
import type { JSX } from "react";
import type { Edificio } from "../types/edificio";
import { fetchEdificios } from "../services/api";
import BuildingCard from "../components/Map/BuildingCard";

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

function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({
        click: () => onMapClick(),
    });
    return null;
}

function MapPage(): JSX.Element {
    const [edificios, setEdificios] = useState<Edificio[]>([]);
    const [selected, setSelected] = useState<Edificio | null>(null);

    useEffect(() => {
        fetchEdificios()
            .then((data: Edificio[]) => setEdificios(data))
            .catch((err) => console.error("Error cargando edificios:", err));
    }, []);

    return (
        <div className="relative h-screen w-full">
            <MapContainer
                center={CU_CENTER}
                zoom={18}
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

                <MapClickHandler onMapClick={() => setSelected(null)} />

                {edificios
                    .filter((e) => e.latitud !== null && e.longitud !== null)
                    .map((edificio) => (
                        <Marker
                            key={edificio.id}
                            position={[edificio.latitud!, edificio.longitud!]}
                            icon={iconoRojo}
                            eventHandlers={{
                                click: () => setSelected(edificio),
                            }}
                        />
                    ))}
            </MapContainer>

            {selected && (
                <BuildingCard
                    edificio={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}

export default MapPage;