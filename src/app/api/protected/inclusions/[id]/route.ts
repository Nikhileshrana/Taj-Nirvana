import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { InclusionFormData } from "@/types/inclusion-exclusion";

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

        const inclusion = await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!inclusion) {
            return NextResponse.json({ error: "Inclusion not found" }, { status: 404 });
        }

        return NextResponse.json(inclusion);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body: InclusionFormData = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const existingInclusion = await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingInclusion) {
            return NextResponse.json({ error: "Inclusion not found" }, { status: 404 });
        }

        // Check if name already exists (excluding current document)
        const duplicate = await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).findOne({
            name: { $regex: new RegExp(`^${body.name}$`, 'i') },
            _id: { $ne: new ObjectId(id) }
        });
        if (duplicate) {
            return NextResponse.json({ error: "Inclusion with this name already exists" }, { status: 409 });
        }

        const updateData = {
            name: body.name.trim(),
            updatedAt: new Date().toISOString()
        };

        await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return NextResponse.json({ ...existingInclusion, ...updateData });
    } catch (error) {
        console.error("Error updating inclusion:", error);
        return NextResponse.json({ error: "Failed to update inclusion" }, { status: 500 });
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

        const existingInclusion = await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingInclusion) {
            return NextResponse.json({ error: "Inclusion not found" }, { status: 404 });
        }

        await db.collection(COLLECTIONS.INCLUSIONS_COLLECTION).deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ message: "Inclusion deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete inclusion" }, { status: 500 });
    }
}
