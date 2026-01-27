import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { uploadImage, deleteImage } from "@/lib/blob";
import type { CategoryFormData } from "@/types/category";

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

        const category = await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, context: RouteContext) {
    try {
        const { id } = await context.params;
        const body: CategoryFormData = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const existingCategory = await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        let imageUrl = body.imageUrl;
        // If new image is provided (base64), upload it and delete old one
        if (imageUrl && imageUrl.startsWith("data:")) {
            // Delete old image if it exists and is a blob url
            if (existingCategory.imageUrl && existingCategory.imageUrl.includes("blob.vercel-storage.com")) {
                try { await deleteImage(existingCategory.imageUrl); } catch (e) { console.error("Failed to delete old image", e); }
            }
            const fileName = `categories/${Date.now()}-${body.slug || "image"}`;
            imageUrl = await uploadImage(imageUrl, fileName);
        }

        const updateData = {
            ...body,
            imageUrl,
            updatedAt: new Date().toISOString()
        };

        await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return NextResponse.json({ ...existingCategory, ...updateData });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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

        const existingCategory = await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).findOne({ _id: new ObjectId(id) });
        if (!existingCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        if (existingCategory.imageUrl && existingCategory.imageUrl.includes("blob.vercel-storage.com")) {
            try { await deleteImage(existingCategory.imageUrl); } catch (e) { console.error("Failed to delete image", e); }
        }

        await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ message: "Category deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
