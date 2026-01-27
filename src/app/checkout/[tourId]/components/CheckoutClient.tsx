"use client"
import { useState, useEffect } from "react";
import Image from "next/image";
import { Tour } from "@/types/tour";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, ShieldCheck, Check, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon as CalendarLucide } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CheckoutClientProps {
    tour: Tour;
    searchParams: { [key: string]: string | string[] | undefined };
}

export function CheckoutClient({ tour, searchParams }: CheckoutClientProps) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds


    // Parse params
    const dateParam = searchParams.date as string;
    const adultsParam = searchParams.adults as string || "1";
    const variantParam = searchParams.variant as string;
    const priceParam = searchParams.price as string;
    const date = dateParam ? new Date(dateParam) : undefined;
    const adults = parseInt(adultsParam);
    const price = priceParam ? parseFloat(priceParam) : (tour.price || 0);

    // Form State for Selection Mode
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
    const [selectedAdults, setSelectedAdults] = useState(adultsParam);
    const [selectedVariant, setSelectedVariant] = useState(variantParam);
    const [selectedPrice, setSelectedPrice] = useState(price);

    // Form State for Contact Mode
    const [leadTraveller, setLeadTraveller] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        if (dateParam) {
            setSelectedDate(new Date(dateParam));
        }
        setSelectedAdults(adultsParam);
        setSelectedVariant(variantParam);
        setSelectedPrice(priceParam ? parseFloat(priceParam) : (tour.price || 0));
    }, [dateParam, adultsParam, variantParam, priceParam, tour.price]);


    const handleVariantChange = (value: string) => {
        const variant = tour.variants?.find(v => v.name === value);
        if (variant) {
            setSelectedPrice(variant.price);
            setSelectedVariant(value);
        }
    };

    const handleBookNow = () => {
        if (!selectedDate) return;

        console.log("Booking Details:", {
            date: selectedDate,
            adults: selectedAdults,
            variant: selectedVariant,
            price: selectedPrice,
            leadTraveller
        });

        // Use router to update URL with params (simulates saving state)
        const params = new URLSearchParams({
            date: selectedDate.toISOString(),
            adults: selectedAdults,
            price: selectedPrice.toString(),
            ...(selectedVariant && { variant: selectedVariant }),
        });

        // In a real app, this would be an API call
        alert("Booking request submitted!");
        router.push(`/checkout/${tour._id}?${params.toString()}`);
    };




    const displayTotalPrice = selectedPrice * parseInt(selectedAdults);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="font-sans">
            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid lg:grid-cols-[1fr_380px] gap-12">

                    {/* Left Column */}
                    <div className="space-y-8">

                        {/* Timer Alert */}
                        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md flex items-center gap-2 text-sm font-medium border border-red-100">
                            <Clock className="w-4 h-4" />
                            <span>We'll hold your spot for {formatTime(timeLeft)} minutes.</span>
                        </div>

                        {/* Secure Badge */}
                        <div className="text-green-700 flex items-center gap-2 text-sm font-medium">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Checkout is fast and secure</span>
                        </div>

                        {/* Tour Info Header */}
                        <div className="flex gap-4 items-start pb-6 border-b border-slate-200">
                            <div className="relative w-24 h-16 rounded-md overflow-hidden shrink-0">
                                <Image
                                    src={tour.coverImage?.url || tour.images?.[0]?.url || "/placeholder.jpg"}
                                    alt={tour.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold leading-tight">{tour.name}</h1>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Booking Details Section */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Booking Details</h2>
                                <div className="grid gap-6 p-6 border rounded-lg bg-white shadow-sm">
                                    {/* Date Picker */}
                                    <div className="grid gap-2">
                                        <Label>Select Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !selectedDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarLucide className="mr-2 h-4 w-4" />
                                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={setSelectedDate}
                                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Adults */}
                                    <div className="grid gap-2">
                                        <Label>Participants</Label>
                                        <Select value={selectedAdults} onValueChange={setSelectedAdults}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select adults" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                                    <SelectItem key={num} value={num.toString()}>{num} Adults</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Variant */}
                                    {tour.variants && tour.variants.length > 0 && (
                                        <div className="grid gap-2">
                                            <Label>Option</Label>
                                            <Select value={selectedVariant} onValueChange={handleVariantChange}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tour.variants.map((v, i) => (
                                                        <SelectItem key={i} value={v.name}>{v.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lead Traveller Section */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">Contact Details</h2>
                                <div className="grid gap-6 p-6 border rounded-lg bg-white shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                placeholder="First Name"
                                                value={leadTraveller.firstName}
                                                onChange={(e) => setLeadTraveller({ ...leadTraveller, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                placeholder="Last Name"
                                                value={leadTraveller.lastName}
                                                onChange={(e) => setLeadTraveller({ ...leadTraveller, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Email Address"
                                                value={leadTraveller.email}
                                                onChange={(e) => setLeadTraveller({ ...leadTraveller, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="Phone Number"
                                                value={leadTraveller.phone}
                                                onChange={(e) => setLeadTraveller({ ...leadTraveller, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address (Optional)</Label>
                                        <Input
                                            id="address"
                                            placeholder="Street Address"
                                            value={leadTraveller.address}
                                            onChange={(e) => setLeadTraveller({ ...leadTraveller, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Book Button */}
                            <Button
                                size="lg"
                                className="w-full md:w-auto px-12 rounded-full text-base font-semibold h-12"
                                onClick={handleBookNow}
                            >
                                Book Now Pay Later
                            </Button>
                        </div>
                    </div>

                    {/* Right Column (Sidebar) */}
                    <div>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg">Order summary</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 pt-6">
                                {/* Tour Summary */}
                                <div className="flex gap-4">
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                        <Image
                                            src={tour.coverImage?.url || tour.images?.[0]?.url || "/placeholder.jpg"}
                                            alt={tour.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{tour.name}</h3>
                                        <div className="flex items-center gap-1 text-xs">
                                            <div className="flex text-orange-500">
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                            </div>
                                            <span className="text-muted-foreground">{(tour.rating || 4.9).toFixed(1)} ({tour.reviewCount || 204})</span>
                                        </div>
                                        <div className="inline-block bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider mt-1">Top rated</div>
                                    </div>
                                </div>

                                {/* Details List */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex gap-3">
                                        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                        <div className="grid gap-0.5">
                                            <span className="font-medium text-slate-900">{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Date not selected"}</span>
                                            <span className="text-muted-foreground text-xs">{tour.duration}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <UsersIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                        <div className="grid gap-0.5">
                                            <span className="font-medium text-slate-900">{selectedAdults} Adult{parseInt(selectedAdults) > 1 ? 's' : ''}</span>
                                            <span className="text-muted-foreground text-xs">Age 18-99</span>
                                        </div>
                                    </div>
                                    {selectedVariant && (
                                        <div className="flex gap-3">
                                            <TagIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="font-medium text-slate-900">{selectedVariant}</span>
                                        </div>
                                    )}
                                </div>



                                <Separator />

                                {/* Features */}
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <Check className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                                        <div className="grid">
                                            <span className="font-medium text-slate-700">Free cancellation</span>
                                            <span>
                                                {selectedDate
                                                    ? `Until ${format(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000), "MMM d")}`
                                                    : "24 hours before trip"}
                                            </span>
                                        </div>
                                    </div>
                                </div>


                                <Separator />

                                {/* Promo Code */}
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900">
                                    <GiftIcon className="w-4 h-4" />
                                    <span className="underline underline-offset-4">Enter promo or gift code</span>
                                </div>


                            </CardContent>
                            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex items-center justify-between">
                                <div className="font-bold text-lg">Total</div>
                                <div className="text-right">
                                    <div className="font-bold text-xl">₹{displayTotalPrice.toLocaleString()}</div>
                                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">All taxes included</div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}

function CalendarIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </svg>
    )
}

function UsersIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

function TagIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l5 5a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-5-5z" />
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
        </svg>
    )
}

function GiftIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
        </svg>
    )
}
