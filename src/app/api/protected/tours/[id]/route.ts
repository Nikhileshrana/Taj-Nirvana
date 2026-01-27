import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadImage, deleteImage } from "@/lib/blob";
import type { TourFormData } from "@/types/tour";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET: Fetch a single tour by ID
export async function GET(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid tour ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const tour = await db.collection(COLLECTIONS.TOURS_COLLECTION).findOne({
            _id: new ObjectId(id),
        });

        if (!tour) {
            return NextResponse.json({ error: "Tour not found" }, { status: 404 });
        }

        return NextResponse.json(tour);
    } catch (error) {
        console.error("Error fetching tour:", error);
        return NextResponse.json({ error: "Failed to fetch tour" }, { status: 500 });
    }
}

// PUT: Update a tour
export async function PUT(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body: TourFormData = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid tour ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Get existing tour to handle image updates
        const existingTour = await db.collection(COLLECTIONS.TOURS_COLLECTION).findOne({
            _id: new ObjectId(id),
        });

        if (!existingTour) {
            return NextResponse.json({ error: "Tour not found" }, { status: 404 });
        }

        // Handle cover image
        // We simply pass through the coverImage object (or null) as provided by the frontend.
        // No longer handling base64 uploads or auto-deletions here as we use a shared Media Library.
        const coverImage = body.coverImage;

        // Handle gallery images
        // We simply pass through the images array which now contains {url, alt} objects.
        const processedImages = body.images || [];

        const updatedTour = {
            ...body,
            coverImage: coverImage,
            images: processedImages,
            updatedAt: new Date().toISOString(),
        };

        const result = await db.collection(COLLECTIONS.TOURS_COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedTour }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Tour not found" }, { status: 404 });
        }

        return NextResponse.json({ ...updatedTour, _id: id });
    } catch (error) {
        console.error("Error updating tour:", error);
        return NextResponse.json({ error: "Failed to update tour" }, { status: 500 });
    }
}

// DELETE: Delete a tour
export async function DELETE(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid tour ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Get tour to delete associated images
        const tour = await db.collection(COLLECTIONS.TOURS_COLLECTION).findOne({
            _id: new ObjectId(id),
        });

        if (!tour) {
            return NextResponse.json({ error: "Tour not found" }, { status: 404 });
        }

        // Delete cover image from blob storage
        if (tour.coverImage && tour.coverImage.includes("blob.vercel-storage.com")) {
            try {
                await deleteImage(tour.coverImage);
            } catch {
                console.warn("Failed to delete cover image from blob storage");
            }
        }

        // Delete all gallery images from blob storage
        if (tour.images && tour.images.length > 0) {
            for (const img of tour.images) {
                if (img.includes("blob.vercel-storage.com")) {
                    try {
                        await deleteImage(img);
                    } catch {
                        console.warn("Failed to delete gallery image from blob storage");
                    }
                }
            }
        }

        // Delete tour from database
        await db.collection(COLLECTIONS.TOURS_COLLECTION).deleteOne({
            _id: new ObjectId(id),
        });

        return NextResponse.json({ message: "Tour deleted successfully" });
    } catch (error) {
        console.error("Error deleting tour:", error);
        return NextResponse.json({ error: "Failed to delete tour" }, { status: 500 });
    }
}

// PATCH: Partial update (for status toggle, featured toggle, etc.)
export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const updates = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid tour ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const result = await db.collection(COLLECTIONS.TOURS_COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Tour not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Tour updated successfully" });
    } catch (error) {
        console.error("Error patching tour:", error);
        return NextResponse.json({ error: "Failed to update tour" }, { status: 500 });
    }
}
