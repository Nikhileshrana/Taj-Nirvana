import { Suspense } from "react";
import { notFound } from "next/navigation";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { Tour } from "@/types/tour";
import { Metadata } from "next";
import { TourGallery } from "./components/TourGallery";
import { TourBookingCard } from "./components/TourBookingCard";
import { TourItinerary } from "./components/TourItinerary";
import { TourReviews } from "./components/TourReviews";
import { TourMap } from "./components/TourMap";
import { Share, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ButtonGroup } from "@/components/ui/button-group"

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getTour(slug: string): Promise<Tour | null> {
    'use cache';
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const tour = await db.collection(COLLECTIONS.TOURS_COLLECTION).findOne({ slug });

    if (!tour) return null;

    // Convert _id to string to match Tour interface
    return {
        ...tour,
        _id: tour._id.toString()
    } as unknown as Tour;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const tour = await getTour(slug);

    if (!tour || tour.status !== 'active') {
        return {
            title: "Tour Not Found",
        };
    }

    return {
        title: tour.name,
        description: tour.description?.substring(0, 160),
        openGraph: {
            title: tour.name,
            description: tour.description?.substring(0, 160),
            images: tour.images?.map(img => ({
                url: img.url,
                alt: img.alt,
                width: 800,
                height: 600,
            })),
        },
        keywords: tour.seoKeywords,
    };
}

async function TourContent({ params }: PageProps) {
    const { slug } = await params;
    const tour = await getTour(slug);

    if (!tour || tour.status !== 'active') {
        notFound();
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 max-w-6xl">
            <div className="grid lg:grid-cols-[1fr_380px] gap-8 relative">

                {/* Left Column: Main Content */}
                <div className="flex flex-col gap-8 min-w-0">

                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="w-full">
                                <div className="flex items-center justify-between gap-2 mb-2 w-full">
                                    <span className="bg-slate-900 text-white text-[10px] font-bold px-3 h-7 flex items-center rounded-sm uppercase tracking-wider">Top rated</span>
                                    <ButtonGroup>
                                        <Button variant="outline" size="sm" className="h-8 text-muted-foreground hover:text-red-500">
                                            <Heart className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-8 text-muted-foreground gap-2">
                                            <Share className="w-3.5 h-3.5" />
                                            Share
                                        </Button>
                                    </ButtonGroup>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                    {tour.name}
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 text-orange-500 font-bold">
                                <span className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className="w-4 h-4 fill-current" />
                                    ))}
                                </span>
                                <span className="text-slate-900 ml-1">{(tour.rating || 4.9).toFixed(1)}</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 underline decoration-slate-300 underline-offset-4">
                                {(tour.reviewCount || 2524).toLocaleString()} reviews
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-medium text-slate-900">{tour.tourType}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-medium text-slate-900">{tour.duration}</span>
                        </div>
                    </div>

                    {/* Gallery */}
                    <TourGallery images={tour.images || []} name={tour.name} coverImage={tour.coverImage || null} />

                    {/* Description */}
                    <div className="space-y-4">
                        <p className="text-lg text-slate-700 leading-relaxed">
                            {tour.description}
                        </p>
                    </div>

                    {/* Itinerary */}
                    <TourItinerary itinerary={tour.itinerary || []} />

                    {/* Map */}
                    <TourMap itinerary={tour.itinerary || []} />

                    {/* Reviews */}
                    <TourReviews />

                </div>

                {/* Right Column: Sticky Booking Card */}
                <div className="relative hidden lg:block">
                    <div className="sticky top-36">
                        <TourBookingCard
                            tourId={tour._id}
                            price={tour.price || 0}
                            variants={tour.variants || []}
                        />
                    </div>
                </div>

                {/* Mobile Floating Booking Button (Optional but good UX) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 border-t bg-muted z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div>
                        <div className="text-sm text-muted-foreground">From</div>
                        <div className="font-bold text-xl">${(tour.price || 0).toLocaleString()}</div>
                    </div>
                    <Link href={`/checkout/${tour._id}`}>
                        <Button size="lg" className="rounded-full font-semibold px-8">
                            Next
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function TourPage({ params }: PageProps) {
    return (
        <Suspense fallback={<div className="container mx-auto py-10 px-4">Loading tour...</div>}>
            <TourContent params={params} />
        </Suspense>
    );
}