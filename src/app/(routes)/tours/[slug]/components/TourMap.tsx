"use client";
import { ItineraryDay } from "@/types/tour";
import Map from "./Map";

interface TourMapProps {
    itinerary: ItineraryDay[];
}

export function TourMap({ itinerary }: TourMapProps) {
    // Extract valid locations from itinerary
    const locations = itinerary
        .filter(day => day.location && day.location.coordinates)
        .map(day => ({
            name: day.location!.name,
            coordinates: day.location!.coordinates
        }));

    if (locations.length === 0) {
        return null;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Tour Map</h2>
            <Map locations={locations} />
        </div>
    );
}
