import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

export const CU_CENTER: LatLngExpression = [31.49261, -106.41446];

export const CU_BOUNDS: LatLngBoundsExpression = [
    [31.498198447766526, -106.409644733004],
    [31.48653567027508, -106.42205879769486],
];

export const urlTile =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

export const ZOOM_THRESHOLD_ESPACIOS = 19;
