import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import type { TourTypeFormData } from "@/types/tour-type";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const tourTypes = await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ tourTypes });
    } catch (error) {
        console.error("Error fetching tour types:", error);
        return NextResponse.json({ error: "Failed to fetch tour types" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body: TourTypeFormData = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Check if name already exists
        const existing = await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).findOne({
            name: { $regex: new RegExp(`^${body.name}$`, 'i') }
        });
        if (existing) {
            return NextResponse.json({ error: "Tour type with this name already exists" }, { status: 409 });
        }

        const newTourType = {
            name: body.name.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const result = await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).insertOne(newTourType);

        return NextResponse.json({ ...newTourType, _id: result.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Error creating tour type:", error);
        return NextResponse.json({ error: "Failed to create tour type" }, { status: 500 });
    }
}
