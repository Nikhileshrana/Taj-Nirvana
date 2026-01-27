import { ItineraryDay } from "@/types/tour";
import { cn } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";
import Image from "next/image";

interface TourItineraryProps {
    itinerary: ItineraryDay[];
}

export function TourItinerary({ itinerary }: TourItineraryProps) {
    if (!itinerary || itinerary.length === 0) return null;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight">Itinerary</h2>
            <div className="space-y-0">
                {itinerary.map((item, index) => (
                    <div key={index} className="flex gap-6">
                        {/* Timeline Column */}
                        <div className="flex flex-col items-center">
                            {/* Dot */}
                            <div className={cn(
                                "relative z-10 flex items-center justify-center shrink-0 rounded-full bg-background",
                                index === 0 || index === itinerary.length - 1
                                    ? "w-8 h-8 ring-1 ring-slate-200 shadow-sm" // Start/End nodes
                                    : "w-4 h-4 my-2" // Middle nodes (aligned with text top)
                            )}>
                                <div className={cn(
                                    "rounded-full",
                                    index === 0 || index === itinerary.length - 1
                                        ? "w-3 h-3 bg-primary"
                                        : "w-2 h-2 bg-slate-300"
                                )} />
                            </div>

                            {/* Line connecting to next item */}
                            {index !== itinerary.length - 1 && (
                                <div className="w-[2px] bg-slate-200 grow my-1" />
                            )}
                        </div>

                        <div className="flex flex-col gap-2 pb-4">
                            <div className="flex items-start justify-between">
                                <h3 className="text-lg font-bold text-slate-900 leading-none">{item.title}</h3>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {item.time && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{item.time}</span>
                                            </div>
                                        )}
                                        {item.location && (
                                            <div className="flex items-center gap-1.5 text-blue-600">
                                                <MapPin className="w-4 h-4" />
                                                <span>{item.location.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-slate-600 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>

                                {item.image && (
                                    <div className="relative w-full sm:w-56 h-52 lg:h-40 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100 mt-2 lg:mt-0">
                                        <Image
                                            src={item.image.url}
                                            alt={item.image.alt || item.title}
                                            fill
                                            className="object-cover hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 1024px) 100vw, 224px"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="pl-4">
                <button className="text-sm font-medium underline underline-offset-4 hover:no-underline">See more details</button>
            </div>
        </div>
    );
}
