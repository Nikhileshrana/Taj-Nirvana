import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { uploadImage } from "@/lib/blob";
import type { TourFormData } from "@/types/tour";

// GET: Fetch paginated tours with search and filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const status = searchParams.get("status") || "";
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Build filter object
        const filter: Record<string, unknown> = {};

        // Search by name
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        const skip = (page - 1) * limit;
        const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

        const [tours, total] = await Promise.all([
            db.collection(COLLECTIONS.TOURS_COLLECTION)
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection(COLLECTIONS.TOURS_COLLECTION).countDocuments(filter)
        ]);

        return NextResponse.json({
            tours,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching tours:", error);
        return NextResponse.json({ error: "Failed to fetch tours" }, { status: 500 });
    }
}

// POST: Create a new tour
export async function POST(request: Request) {
    try {
        const body: TourFormData = await request.json();

        // Validate required fields
        if (!body.name || !body.price) {
            return NextResponse.json(
                { error: "Name and price are required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Handle cover image
        // Deprecated: Base64 upload logic is removed as frontend now uses Media Picker which returns URLs.
        // We simply pass through the coverImage object.
        const coverImage = body.coverImage;

        // Handle gallery images
        // We simply pass through the images array which now contains {url, alt} objects.
        const processedImages = body.images || [];

        const now = new Date().toISOString();
        const newTour = {
            ...body,
            coverImage: coverImage,
            images: processedImages,
            rating: 0,
            reviewCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection(COLLECTIONS.TOURS_COLLECTION).insertOne(newTour);

        return NextResponse.json(
            { ...newTour, _id: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating tour:", error);
        return NextResponse.json({ error: "Failed to create tour" }, { status: 500 });
    }
}
