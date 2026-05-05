import L from "leaflet";

export const createBuildingIcon = (codigo: string) => {
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

export const createEmojiIcon = (emoji: string, colorHex: string, isPulsing: boolean = false) => {
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

export const createUserLocationIcon = () => {
    return L.divIcon({
        className: 'custom-user-location-marker bg-transparent border-none',
        html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div class="animate-ping" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #3b82f6; opacity: 0.7;"></div>
            <div style="
                background-color: #2563eb;
                border: 3px solid #ffffff;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
                z-index: 10;
            "></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};
