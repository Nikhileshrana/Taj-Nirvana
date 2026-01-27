import { Suspense } from "react";
import { notFound } from "next/navigation";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { Tour } from "@/types/tour";
import { CheckoutClient } from "./components/CheckoutClient";

interface PageProps {
    params: Promise<{ tourId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getTour(tourId: string): Promise<Tour | null> {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        // Validate if tourId is a valid ObjectId
        if (!ObjectId.isValid(tourId)) return null;

        const tour = await db.collection(COLLECTIONS.TOURS_COLLECTION).findOne({ _id: new ObjectId(tourId) });

        if (!tour) return null;

        return {
            ...tour,
            _id: tour._id.toString()
        } as unknown as Tour;
    } catch (error) {
        console.error("Error fetching tour:", error);
        return null;
    }
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
    const { tourId } = await params;
    const resolvedSearchParams = await searchParams; // Await search params
    const tour = await getTour(tourId);

    if (!tour) {
        notFound();
    }

    return (
        <Suspense fallback={<div className="container mx-auto py-10 px-4">Loading checkout...</div>}>
            <CheckoutClient
                tour={tour}
                searchParams={resolvedSearchParams}
            />
        </Suspense>
    );
}
