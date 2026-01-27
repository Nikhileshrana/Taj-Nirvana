"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// If you don't have local images, we can use CDN for now or try to fix imports
// Better to use online versions for safety unless user has assets
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;


interface Location {
    name: string;
    coordinates: {
        lat: number;
        lon: number;
    };
}

interface MapProps {
    locations: Location[];
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

function BoundsHandler({ locations }: { locations: Location[] }) {
    const map = useMap();

    useEffect(() => {
        if (locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(loc => [loc.coordinates.lat, loc.coordinates.lon]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [locations, map]);

    return null;
}

export default function Map({ locations }: MapProps) {
    const [mapId] = useState(() => Math.random().toString());

    if (!locations || locations.length === 0) return null;

    const center: [number, number] = [locations[0].coordinates.lat, locations[0].coordinates.lon];
    const polylinePositions = locations.map(loc => [loc.coordinates.lat, loc.coordinates.lon] as [number, number]);

    return (
        <div key={mapId} className="h-[400px] w-full rounded-xl overflow-hidden z-0 relative">
            <MapContainer
                center={center}
                zoom={10}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Polyline
                    positions={polylinePositions}
                    pathOptions={{ color: '#f97316', dashArray: '10, 10', weight: 3 }} // Orange dotted line
                />

                {locations.map((loc, idx) => (
                    <Marker
                        key={idx}
                        position={[loc.coordinates.lat, loc.coordinates.lon]}
                    >
                        <Popup>
                            <span className="font-semibold">{loc.name}</span>
                        </Popup>
                    </Marker>
                ))}
                <BoundsHandler locations={locations} />
            </MapContainer>
        </div>
    );
}
