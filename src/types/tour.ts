export interface TourVariant {
    name: string;
    price: number;
}

export interface TourImage {
    url: string;
    alt: string;
}

export interface Tour {
    _id: string;
    name: string;
    description: string;
    duration: string; // e.g., "3 Days / 2 Nights"
    price: number;
    variants?: TourVariant[];
    category: TourCategory;
    tourType?: string; // Tour type ID
    inclusions: string[];
    exclusions: string[];
    itinerary: ItineraryDay[];
    images: TourImage[];
    coverImage: TourImage;
    video?: string;
    difficulty: TourDifficulty;
    status: TourStatus;
    featured: boolean;
    rating?: number;
    reviewCount?: number;
    // SEO fields
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ItineraryDay {
    time: string;
    title: string;
    description: string;
    image?: TourImage; // Image object for the itinerary item
    location?: {
        name: string; // Location name for search
        displayName: string; // Full display name from Nominatim
        coordinates: {
            lat: number;
            lon: number;
        };
    };
}

export type TourCategory = string;

export type TourDifficulty = "easy" | "moderate" | "challenging";

export type TourStatus = "active" | "inactive";

export interface TourFormData {
    name: string;
    description: string;
    duration: string;
    price: number;
    variants: TourVariant[];
    category: TourCategory;
    tourType?: string;
    inclusions: string[];
    exclusions: string[];
    itinerary: ItineraryDay[];
    images: TourImage[];
    coverImage: TourImage | null;
    video?: string;
    difficulty: TourDifficulty;
    status: TourStatus;
    featured: boolean;
    slug?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
}

export interface PaginatedToursResponse {
    tours: Tour[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
