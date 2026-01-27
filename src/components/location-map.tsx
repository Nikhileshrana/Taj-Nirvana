"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface LocationMapProps {
    latitude: number;
    longitude: number;
    locationName?: string;
    zoom?: number;
    height?: string;
    className?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
    latitude,
    longitude,
    locationName,
    zoom = 13,
    height = "300px",
    className = "",
}) => {
    return (
        <div className={className} style={{ height, width: "100%", borderRadius: "8px", overflow: "hidden" }}>
            <MapContainer
                center={[latitude, longitude]}
                zoom={zoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]} icon={icon}>
                    {locationName && <Popup>{locationName}</Popup>}
                </Marker>
            </MapContainer>
        </div>
    );
};
