"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, CalendarIcon, Users, CreditCard } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TourVariant } from "@/types/tour";
import { useRouter } from "next/navigation";

interface TourBookingCardProps {
    tourId: string;
    price: number;
    variants?: TourVariant[];
}

export function TourBookingCard({ tourId, price, variants = [] }: TourBookingCardProps) {
    const router = useRouter();
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedPrice, setSelectedPrice] = useState(price);
    const [adults, setAdults] = useState("1");
    const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);

    const handleVariantChange = (value: string) => {
        const variant = variants?.find(v => v.name === value);
        if (variant) {
            setSelectedPrice(variant.price);
            setSelectedVariant(value);
        }
    };

    const handleReserve = () => {
        const params = new URLSearchParams({
            adults: adults,
            price: selectedPrice.toString(),
            ...(date && { date: date.toISOString() }),
            ...(selectedVariant && { variant: selectedVariant }),
        });

        router.push(`/checkout/${tourId}?${params.toString()}`);
    };

    return (
        <Card className="w-full sticky">
            <CardHeader className="space-y-1 pb-4">
                <p className="text-sm text-muted-foreground font-medium">From</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">${selectedPrice.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs">per person</span>
                </div>
            </CardHeader>
            <CardContent className="grid gap-4">

                {/* Variant Selector */}
                {variants && variants.length > 0 && (
                    <div className="grid gap-2">
                        <Select onValueChange={handleVariantChange}>
                            <SelectTrigger className="w-full">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <SelectValue placeholder="Select Option" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {variants.map((v, i) => (
                                    <SelectItem key={i} value={v.name}>
                                        <div className="flex justify-between w-full gap-4">
                                            <span>{v.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}


                {/* Adults Selector */}
                <div className="grid gap-2">
                    <Select value={adults} onValueChange={setAdults}>
                        <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Adult x</span>
                                <SelectValue />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Picker */}
                <div className="grid gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Select date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Check Reservation Button */}
                <Button
                    size="lg"
                    className="w-full text-base font-semibold rounded-full cursor-pointer"
                    onClick={handleReserve}
                >
                    Next
                </Button>

            </CardContent>
            <CardFooter>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-3 text-sm text-muted-foreground">
                        <Check className="w-5 h-5 text-green-600 shrink-0" />
                        <div className="grid gap-0.5">
                            <span className="font-medium text-foreground">Free cancellation</span>
                            <span className="text-xs">Cancel up to 24 hours in advance for a full refund</span>
                        </div>
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                        <Check className="w-5 h-5 text-green-600 shrink-0" />
                        <div className="grid gap-0.5">
                            <span className="font-medium text-foreground">Reserve now & pay later</span>
                            <span className="text-xs">Book your spot and pay nothing today.</span>
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
