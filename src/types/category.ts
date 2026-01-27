export interface Category {
    _id: string;
    name: string;
    description?: string;
    slug: string;
    imageUrl?: string;
    count?: number; // Optional count of tours in this category
    sequence?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryFormData {
    name: string;
    description?: string;
    slug: string;
    imageUrl?: string;
}
