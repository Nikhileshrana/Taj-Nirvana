import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import type { InclusionFormData } from "@/types/inclusion-exclusion";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const inclusions = await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ inclusions });
    } catch (error) {
        console.error("Error fetching inclusions:", error);
        return NextResponse.json({ error: "Failed to fetch inclusions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body: InclusionFormData = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Check if name already exists
        const existing = await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).findOne({
            name: { $regex: new RegExp(`^${body.name}$`, 'i') }
        });
        if (existing) {
            return NextResponse.json({ error: "Inclusion with this name already exists" }, { status: 409 });
        }

        const newInclusion = {
            name: body.name.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const result = await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).insertOne(newInclusion);

        return NextResponse.json({ ...newInclusion, _id: result.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Error creating inclusion:", error);
        return NextResponse.json({ error: "Failed to create inclusion" }, { status: 500 });
    }
}
