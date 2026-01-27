import { NextResponse } from "next/server";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/mongodb";
import { uploadImage } from "@/lib/blob";
import type { CategoryFormData } from "@/types/category";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const filter: any = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const [categories, total] = await Promise.all([
            db.collection(COLLECTIONS.CATEGORIES_COLLECTION)
                .find(filter)
                .sort({ sequence: 1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection(COLLECTIONS.CATEGORIES_COLLECTION).countDocuments(filter)
        ]);

        return NextResponse.json({
            categories,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body: CategoryFormData = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Check if slug exists
        const slug = body.slug || body.name.toLowerCase().replace(/ /g, "-");
        const existing = await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: "Category with this slug already exists" }, { status: 409 });
        }

        // Get max sequence
        const lastCategory = await db.collection(COLLECTIONS.CATEGORIES_COLLECTION)
            .find()
            .sort({ sequence: -1 })
            .limit(1)
            .toArray();
        const sequence = (lastCategory[0]?.sequence || 0) + 1;

        let imageUrl = body.imageUrl;
        if (imageUrl && imageUrl.startsWith("data:")) {
            const fileName = `categories/${Date.now()}-${slug}`;
            imageUrl = await uploadImage(imageUrl, fileName);
        }

        const newCategory = {
            ...body,
            slug,
            imageUrl,
            sequence,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const result = await db.collection(COLLECTIONS.CATEGORIES_COLLECTION).insertOne(newCategory);

        return NextResponse.json({ ...newCategory, _id: result.insertedId }, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
