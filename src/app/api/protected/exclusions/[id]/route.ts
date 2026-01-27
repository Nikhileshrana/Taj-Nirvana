import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { ExclusionFormData } from "@/types/inclusion-exclusion";

interface RouteContext {
    params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const exclusion = await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!exclusion) {
            return NextResponse.json({ error: "Exclusion not found" }, { status: 404 });
        }

        return NextResponse.json(exclusion);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body: ExclusionFormData = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const existingExclusion = await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingExclusion) {
            return NextResponse.json({ error: "Exclusion not found" }, { status: 404 });
        }

        // Check if name already exists (excluding current document)
        const duplicate = await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).findOne({
            name: { $regex: new RegExp(`^${body.name}$`, 'i') },
            _id: { $ne: new ObjectId(id) }
        });
        if (duplicate) {
            return NextResponse.json({ error: "Exclusion with this name already exists" }, { status: 409 });
        }

        const updateData = {
            name: body.name.trim(),
            updatedAt: new Date().toISOString()
        };

        await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return NextResponse.json({ ...existingExclusion, ...updateData });
    } catch (error) {
        console.error("Error updating exclusion:", error);
        return NextResponse.json({ error: "Failed to update exclusion" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const existingExclusion = await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingExclusion) {
            return NextResponse.json({ error: "Exclusion not found" }, { status: 404 });
        }

        await db.collection(COLLECTIONS.EXCLUSIONS_COLLECTION).deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ message: "Exclusion deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete exclusion" }, { status: 500 });
    }
}
