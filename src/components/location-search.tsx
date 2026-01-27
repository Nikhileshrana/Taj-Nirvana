"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface NominatimResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    name: string;
}

interface LocationSearchProps {
    onLocationSelect: (location: {
        name: string;
        displayName: string;
        coordinates: { lat: number; lon: number };
    }) => void;
    placeholder?: string;
    initialValue?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
    onLocationSelect,
    placeholder = "Search for a location...",
    initialValue = "",
}) => {
    const [searchQuery, setSearchQuery] = useState(initialValue);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    const searchLocation = async () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a location to search");
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                    searchQuery
                )}&format=json&limit=5`
            );

            if (!response.ok) {
                throw new Error("Failed to search location");
            }

            const data: NominatimResult[] = await response.json();

            if (data.length === 0) {
                toast.error("No locations found. Try a different search term.");
                setResults([]);
            } else {
                setResults(data);
                setShowResults(true);
            }
        } catch (error) {
            console.error("Location search error:", error);
            toast.error("Failed to search location");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectLocation = (result: NominatimResult) => {
        onLocationSelect({
            name: result.name || searchQuery,
            displayName: result.display_name,
            coordinates: {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
            },
        });
        setShowResults(false);
        setSearchQuery(result.name || result.display_name);
        toast.success("Location selected");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            searchLocation();
        }
    };

    return (
        <div className="relative">
            <div className="flex gap-2">
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="flex-1"
                />
                <Button
                    type="button"
                    onClick={searchLocation}
                    disabled={isSearching}
                    size="icon"
                >
                    {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {results.map((result) => (
                        <button
                            key={result.place_id}
                            type="button"
                            onClick={() => handleSelectLocation(result)}
                            className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-start gap-2 border-b last:border-b-0"
                        >
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                    {result.name || "Unnamed Location"}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                    {result.display_name}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
