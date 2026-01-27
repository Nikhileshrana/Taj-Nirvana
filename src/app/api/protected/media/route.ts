import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { uploadImage, deleteImage } from "@/lib/blob";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const filter: any = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const skip = (page - 1) * limit;

        const [media, total] = await Promise.all([
            db.collection(COLLECTIONS.MEDIA_COLLECTION)
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection(COLLECTIONS.MEDIA_COLLECTION).countDocuments(filter)
        ]);

        return NextResponse.json({
            media,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching media:", error);
        return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { image, name, type } = await request.json();

        if (!image || !name) {
            return NextResponse.json({ error: "Image and name are required" }, { status: 400 });
        }

        // Upload to Vercel Blob
        // Prepend timestamp to ensure uniqueness and prevent "BlobAlreadyExists" errors
        const uniqueName = `${Date.now()}-${name}`;
        const url = await uploadImage(image, uniqueName);

        // Save metadata to MongoDB
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const newMedia = {
            name, // Keep original display name
            type,
            url,
            createdAt: new Date(),
        };

        const result = await db.collection(COLLECTIONS.MEDIA_COLLECTION).insertOne(newMedia);

        return NextResponse.json({ ...newMedia, _id: result.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Error uploading media:", error);
        return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, name } = await request.json();

        if (!id || !name) {
            return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const { ObjectId } = await import("mongodb");

        const result = await db.collection(COLLECTIONS.MEDIA_COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            { $set: { name } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: "Media not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Media updated successfully" });
    } catch (error) {
        console.error("Error updating media:", error);
        return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const url = searchParams.get("url");

        if (!id || !url) {
            return NextResponse.json({ error: "Media ID and URL are required" }, { status: 400 });
        }

        // Delete from Vercel Blob
        await deleteImage(url);

        // Delete from MongoDB
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Import ObjectId dynamically or from mongodb if available globally in scope, 
        // but typically better to import it at top. 
        // Re-checking imports, I need to add ObjectId to import if I use it.
        const { ObjectId } = await import("mongodb");

        await db.collection(COLLECTIONS.MEDIA_COLLECTION).deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ message: "Media deleted successfully" });
    } catch (error) {
        console.error("Error deleting media:", error);
        return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
    }
}
