import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import type { TourTypeFormData } from "@/types/tour-type";

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

        const tourType = await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!tourType) {
            return NextResponse.json({ error: "Tour type not found" }, { status: 404 });
        }

        return NextResponse.json(tourType);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body: TourTypeFormData = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const existingTourType = await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingTourType) {
            return NextResponse.json({ error: "Tour type not found" }, { status: 404 });
        }

        // Check if name already exists (excluding current document)
        const duplicate = await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).findOne({
            name: { $regex: new RegExp(`^${body.name}$`, 'i') },
            _id: { $ne: new ObjectId(id) }
        });
        if (duplicate) {
            return NextResponse.json({ error: "Tour type with this name already exists" }, { status: 409 });
        }

        const updateData = {
            name: body.name.trim(),
            updatedAt: new Date().toISOString()
        };

        await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return NextResponse.json({ ...existingTourType, ...updateData });
    } catch (error) {
        console.error("Error updating tour type:", error);
        return NextResponse.json({ error: "Failed to update tour type" }, { status: 500 });
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

        const existingTourType = await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingTourType) {
            return NextResponse.json({ error: "Tour type not found" }, { status: 404 });
        }

        await db.collection(COLLECTIONS.TOUR_TYPES_COLLECTION).deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ message: "Tour type deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete tour type" }, { status: 500 });
    }
}
