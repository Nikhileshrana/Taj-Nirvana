import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import type { ExclusionFormData } from "@/types/inclusion-exclusion";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const exclusions = await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION)
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ exclusions });
    } catch (error) {
        console.error("Error fetching exclusions:", error);
        return NextResponse.json({ error: "Failed to fetch exclusions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body: ExclusionFormData = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Check if name already exists
        const existing = await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).findOne({
            name: { $regex: new RegExp(`^${body.name}$`, 'i') }
        });
        if (existing) {
            return NextResponse.json({ error: "Exclusion with this name already exists" }, { status: 409 });
        }

        const newExclusion = {
            name: body.name.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const result = await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).insertOne(newExclusion);

        return NextResponse.json({ ...newExclusion, _id: result.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Error creating exclusion:", error);
        return NextResponse.json({ error: "Failed to create exclusion" }, { status: 500 });
    }
}
