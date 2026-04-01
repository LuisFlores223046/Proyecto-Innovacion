import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { JSX } from "react";

const CU_CENTER: LatLngExpression = [31.49261, -106.41446];

const CU_BOUNDS: LatLngBoundsExpression = [
    [31.498198447766526, -106.409644733004], // Esquina Noreste
    [31.48653567027508, -106.42205879769486], // Esquina Suroeste
];
const urlTile = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

function MapPage(): JSX.Element {
    return (
        <MapContainer
            center={CU_CENTER}
            zoom={18}
            minZoom={16}
            scrollWheelZoom={true}
            className="h-[100vh] w-full"
            maxBounds={CU_BOUNDS}
            maxBoundsViscosity={1}
            zoomControl={true}

        >
            <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url={urlTile}
            />
        </MapContainer>
    )
}

export default MapPage