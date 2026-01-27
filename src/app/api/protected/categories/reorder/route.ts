import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { categories } = body; // Array of { _id, sequence } or just ordered IDs

        if (!Array.isArray(categories)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Bulk write for performance
        const operations = categories.map((cat: any, index: number) => ({
            updateOne: {
                filter: { _id: new ObjectId(cat._id) },
                update: { $set: { sequence: index + 1 } }
            }
        }));

        if (operations.length > 0) {
            await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).bulkWrite(operations);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering categories:", error);
        return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
    }
}
