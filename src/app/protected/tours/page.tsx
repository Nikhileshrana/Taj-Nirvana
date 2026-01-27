"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Star,
    MapPin,
    Clock,
    MoreHorizontal,
    Image as ImageIcon,
    X,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Settings2 } from "lucide-react";
import Image from "next/image";
import type {
    Tour,
    TourFormData,
    TourCategory,
    TourDifficulty,
    TourStatus,
    ItineraryDay,
} from "@/types/tour";
import type { Category } from "@/types/category";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import type { MediaItem } from "@/types/media";
import { LocationSearch } from "@/components/location-search";
import dynamic from "next/dynamic";

// Dynamically import LocationMap to avoid SSR issues with Leaflet
const LocationMap = dynamic(() => import("@/components/location-map").then(mod => ({ default: mod.LocationMap })), {
    ssr: false,
    loading: () => <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">Loading map...</div>
});


const DIFFICULTIES: { value: TourDifficulty; label: string }[] = [
    { value: "easy", label: "Easy" },
    { value: "moderate", label: "Moderate" },
    { value: "challenging", label: "Challenging" },
];

const STATUSES: { value: TourStatus; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
];

const defaultFormData: TourFormData = {
    name: "",
    description: "",
    duration: "",
    price: 0,
    category: "",
    inclusions: [],
    exclusions: [],
    itinerary: [],
    variants: [],
    images: [],
    coverImage: null,
    video: "",
    difficulty: "easy",
    status: "inactive",
    featured: false,
    slug: "",
    seoKeywords: "",
};

const ToursPage = () => {
    // Data state
    const [tours, setTours] = useState<Tour[]>([]);

    const [categories, setCategories] = useState<Category[]>([]);
    const [tourTypes, setTourTypes] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Sheet states
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Media picker state
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [pickingFor, setPickingFor] = useState<"cover" | "gallery" | "itinerary">("cover");

    // Form state
    const [formData, setFormData] = useState<TourFormData>(defaultFormData);
    // Derived SEO fields
    const [seoKeywords, setSeoKeywords] = useState("");
    const [keywordInput, setKeywordInput] = useState("");
    const [slug, setSlug] = useState("");

    const [editingItineraryIndex, setEditingItineraryIndex] = useState<number | null>(null);
    const [tempEditingItinerary, setTempEditingItinerary] = useState<Partial<ItineraryDay>>({});
    const [currentItinerary, setCurrentItinerary] = useState<Partial<ItineraryDay>>({
        time: "",
        title: "",
        description: "",
    });

    // Inclusions/Exclusions state
    const [inclusions, setInclusions] = useState<{ _id: string; name: string }[]>([]);
    const [exclusions, setExclusions] = useState<{ _id: string; name: string }[]>([]);
    const [isInclusionsSheetOpen, setIsInclusionsSheetOpen] = useState(false);
    const [isExclusionsSheetOpen, setIsExclusionsSheetOpen] = useState(false);
    const [newInclusionName, setNewInclusionName] = useState("");
    const [newExclusionName, setNewExclusionName] = useState("");
    const [isTourTypesSheetOpen, setIsTourTypesSheetOpen] = useState(false);
    const [newTourTypeName, setNewTourTypeName] = useState("");

    // Edit state
    const [editingInclusion, setEditingInclusion] = useState<{ id: string, name: string } | null>(null);
    const [editingExclusion, setEditingExclusion] = useState<{ id: string, name: string } | null>(null);
    const [editingTourType, setEditingTourType] = useState<{ id: string, name: string } | null>(null);

    // Fetch all tours and categories
    const fetchData = async () => {
        setLoading(true);
        try {
            const [toursRes, catsRes, typesRes, incRes, excRes] = await Promise.all([
                fetch("/api/protected/tours?limit=1000"),
                fetch("/api/protected/categories"),
                fetch("/api/protected/tour-types"),
                fetch("/api/protected/inclusions"),
                fetch("/api/protected/exclusions")
            ]);

            const toursData = await toursRes.json();
            const catsData = await catsRes.json();
            const typesData = await typesRes.json();
            const incData = await incRes.json();
            const excData = await excRes.json();

            setTours(toursData.tours || []);
            setCategories(catsData.categories || catsData || []);
            setTourTypes(typesData.tourTypes || []);
            setInclusions(incData.inclusions || []);
            setExclusions(excData.exclusions || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Form handlers
    const openCreateForm = () => {
        setFormData(defaultFormData);
        setSeoKeywords("");
        setSlug("");
        setIsEditing(false);
        setSelectedTour(null);
        setCurrentStep(1);
        setIsSheetOpen(true);
    };

    const openEditForm = (tour: Tour) => {
        setFormData({
            name: tour.name,
            description: tour.description,
            duration: tour.duration,
            price: tour.price,
            category: tour.category,
            tourType: tour.tourType,
            variants: tour.variants || [],
            inclusions: (tour.inclusions || []).map(inc => inclusions.find(i => i._id === inc)?.name || inc),
            exclusions: (tour.exclusions || []).map(exc => exclusions.find(e => e._id === exc)?.name || exc),
            itinerary: tour.itinerary || [],
            images: tour.images || [],
            coverImage: tour.coverImage || "",
            video: tour.video || "",
            difficulty: tour.difficulty,
            status: tour.status,
            featured: tour.featured,
            // derived/separate fields usually handled by state or defaults
            slug: tour.slug,
            seoKeywords: tour.seoKeywords,
        });
        setSeoKeywords(tour.seoKeywords || "");
        setSlug(tour.slug || "");
        setIsEditing(true);
        setSelectedTour(tour);
        setCurrentStep(1);
        setIsSheetOpen(true);
    };

    const openDeleteDialog = (tour: Tour) => {
        setSelectedTour(tour);
        setIsDeleteOpen(true);
    };

    const openMediaPicker = (forType: "cover" | "gallery") => {
        setPickingFor(forType);
        setIsMediaPickerOpen(true);
    };

    const handleMediaSelect = (selected: MediaItem[]) => {
        if (pickingFor === "cover") {
            if (selected.length > 0) {
                setFormData({ ...formData, coverImage: { url: selected[0].url, alt: selected[0].name } });
            }
        } else if (pickingFor === "gallery") {
            // Gallery
            const newImages = selected.map(m => ({ url: m.url, alt: m.name }));
            // Avoid duplicates based on URL
            const validNewImages = newImages.filter(ni => !formData.images.some(fi => fi.url === ni.url));
            setFormData({ ...formData, images: [...formData.images, ...validNewImages] });
        } else if (pickingFor === "itinerary") {
            // Itinerary image
            if (selected.length > 0) {
                const imgData = { url: selected[0].url, alt: selected[0].name };
                if (editingItineraryIndex !== null) {
                    setTempEditingItinerary({ ...tempEditingItinerary, image: imgData });
                } else {
                    setCurrentItinerary({ ...currentItinerary, image: imgData });
                }
            }
        }
        setIsMediaPickerOpen(false);
    };

    // Toggle Handlers
    // Toggle Handlers
    const toggleInclusion = (name: string) => {
        setFormData(prev => {
            const exists = prev.inclusions.includes(name);
            if (exists) {
                return { ...prev, inclusions: prev.inclusions.filter(i => i !== name) };
            } else {
                return { ...prev, inclusions: [...prev.inclusions, name] };
            }
        });
    };

    const toggleExclusion = (name: string) => {
        setFormData(prev => {
            const exists = prev.exclusions.includes(name);
            if (exists) {
                return { ...prev, exclusions: prev.exclusions.filter(e => e !== name) };
            } else {
                return { ...prev, exclusions: [...prev.exclusions, name] };
            }
        });
    };

    // Inclusion Handlers
    const handleCreateInclusion = async () => {
        if (!newInclusionName.trim()) return toast.error("Name is required");
        try {
            const res = await fetch("/api/protected/protected/inclusions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newInclusionName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Inclusion created");
            setNewInclusionName("");
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || "Failed to create inclusion");
        }
    };

    const handleDeleteInclusion = async (id: string) => {
        if (!confirm("Delete this inclusion?")) return;
        try {
            await fetch(`/api/protected/inclusions/${id}`, { method: "DELETE" });
            toast.success("Inclusion deleted");
            // Remove from selected if present (by name)
            const name = inclusions.find(i => i._id === id)?.name;
            if (name && formData.inclusions.includes(name)) {
                setFormData(prev => ({ ...prev, inclusions: prev.inclusions.filter(i => i !== name) }));
            }
            fetchData();
        } catch (error) {
            toast.error("Failed to delete inclusion");
        }
    };

    const handleUpdateInclusion = async () => {
        if (!editingInclusion || !editingInclusion.name.trim()) return;
        try {
            const res = await fetch(`/api/protected/inclusions/${editingInclusion.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editingInclusion.name.trim() }),
            });
            if (!res.ok) throw new Error("Failed to update");

            toast.success("Inclusion updated");
            setEditingInclusion(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to update inclusion");
        }
    };

    // Exclusion Handlers
    const handleCreateExclusion = async () => {
        if (!newExclusionName.trim()) return toast.error("Name is required");
        try {
            const res = await fetch("/api/protected/exclusions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newExclusionName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Exclusion created");
            setNewExclusionName("");
            fetchData(); // Refresh list
        } catch (error: any) {
            toast.error(error.message || "Failed to create exclusion");
        }
    };

    const handleDeleteExclusion = async (id: string) => {
        if (!confirm("Delete this exclusion?")) return;
        try {
            await fetch(`/api/protected/exclusions/${id}`, { method: "DELETE" });
            toast.success("Exclusion deleted");
            // Remove from selected if present (by name)
            const name = exclusions.find(e => e._id === id)?.name;
            if (name && formData.exclusions.includes(name)) {
                setFormData(prev => ({ ...prev, exclusions: prev.exclusions.filter(e => e !== name) }));
            }
            fetchData();
        } catch (error) {
            toast.error("Failed to delete exclusion");
        }
    };

    const handleUpdateExclusion = async () => {
        if (!editingExclusion || !editingExclusion.name.trim()) return;
        try {
            const res = await fetch(`/api/protected/exclusions/${editingExclusion.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editingExclusion.name.trim() }),
            });
            if (!res.ok) throw new Error("Failed to update");

            toast.success("Exclusion updated");
            setEditingExclusion(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to update exclusion");
        }
    };

    // Tour Type Handlers
    const handleCreateTourType = async () => {
        if (!newTourTypeName.trim()) return toast.error("Name is required");
        try {
            const res = await fetch("/api/protected/tour-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTourTypeName.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Tour type created");
            setNewTourTypeName("");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to create tour type");
        }
    };

    const handleDeleteTourType = async (id: string) => {
        if (!confirm("Delete this tour type?")) return;
        try {
            await fetch(`/api/protected/tour-types/${id}`, { method: "DELETE" });
            toast.success("Tour type deleted");
            if (formData.tourType === id) {
                setFormData(prev => ({ ...prev, tourType: undefined }));
            }
            fetchData();
        } catch (error) {
            toast.error("Failed to delete tour type");
        }
    };

    const handleUpdateTourType = async () => {
        if (!editingTourType || !editingTourType.name.trim()) return;
        try {
            const res = await fetch(`/api/protected/tour-types/${editingTourType.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editingTourType.name.trim() }),
            });
            if (!res.ok) throw new Error("Failed to update");

            toast.success("Tour type updated");
            setEditingTourType(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to update tour type");
        }
    };

    const handleAddKeyword = () => {
        if (!keywordInput.trim()) return;
        const currentKeywords = seoKeywords ? seoKeywords.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (currentKeywords.length >= 3) {
            toast.error("Maximum 3 keywords allowed");
            return;
        }
        if (currentKeywords.includes(keywordInput.trim())) {
            toast.error("Keyword already exists");
            return;
        }
        const newKeywords = [...currentKeywords, keywordInput.trim()];
        setSeoKeywords(newKeywords.join(', '));
        setKeywordInput("");
    };

    const removeKeyword = (index: number) => {
        const currentKeywords = seoKeywords ? seoKeywords.split(',').map(s => s.trim()).filter(Boolean) : [];
        const newKeywords = currentKeywords.filter((_, i) => i !== index);
        setSeoKeywords(newKeywords.join(', '));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.category) {
            toast.error("Please fill in all required fields");
            setCurrentStep(1);
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                seoKeywords,
                seoTitle: formData.name,
                seoDescription: formData.description,
                slug: slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            };

            const url = isEditing ? `/api/protected/tours/${selectedTour?._id}` : "/api/protected/tours";
            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to save tour");
            }

            toast.success(isEditing ? "Tour updated successfully" : "Tour created successfully");
            setIsSheetOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving tour:", error);
            toast.error(error instanceof Error ? error.message : "Failed to save tour");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTour) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/protected/tours/${selectedTour._id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete tour");

            toast.success("Tour deleted successfully");
            setIsDeleteOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting tour:", error);
            toast.error("Failed to delete tour");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleFeatured = async (tour: Tour) => {
        try {
            const res = await fetch(`/api/protected/tours/${tour._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featured: !tour.featured }),
            });

            if (!res.ok) throw new Error("Failed to update tour");

            toast.success(tour.featured ? "Tour unfeatured" : "Tour featured");
            fetchData();
        } catch (error) {
            console.error("Error toggling featured:", error);
            toast.error("Failed to update tour");
        }
    };

    const handleStatusChange = async (tour: Tour, newStatus: TourStatus) => {
        try {
            const res = await fetch(`/api/protected/tours/${tour._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(`Tour status changed to ${newStatus}`);
            fetchData();
        } catch (error) {
            console.error("Error changing status:", error);
            toast.error("Failed to update status");
        }
    };

    const removeCoverImage = () => {
        setFormData({ ...formData, coverImage: null });
    };

    const removeGalleryImage = (url: string) => {
        setFormData({
            ...formData,
            images: formData.images.filter((img) => img.url !== url),
        });
    };

    // Table columns
    const columns: ColumnDef<Tour>[] = [
        {
            accessorKey: "name",
            header: "Tour Name",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className="font-medium">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize">
                    {row.original.category}
                </Badge>
            ),
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold">${row.original.price.toLocaleString()}</span>
                    {row.original.variants && row.original.variants.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {row.original.variants.length} options
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "duration",
            header: "Duration",
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {row.original.duration || "-"}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.original.status === "active"}
                        onCheckedChange={(checked) => handleStatusChange(row.original, checked ? "active" : "inactive")}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{row.original.status}</span>
                </div>
            ),
        },
        {
            accessorKey: "featured",
            header: "Featured",
            cell: ({ row }) =>
                row.original.featured ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ) : (
                    <Star className="h-4 w-4 text-muted-foreground/30" />
                ),
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEditForm(row.original)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFeatured(row.original)}>
                            <Star className="mr-2 h-4 w-4" />
                            {row.original.featured ? "Unfeature" : "Feature"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Status
                        </DropdownMenuLabel>
                        {STATUSES.map((s) => (
                            <DropdownMenuItem
                                key={s.value}
                                onClick={() => handleStatusChange(row.original, s.value)}
                                disabled={row.original.status === s.value}
                            >
                                {s.label}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => openDeleteDialog(row.original)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="flex flex-1 flex-col gap-2 p-6">
            {/* Data Table */}
            <DataTable
                columns={columns}
                data={tours}
                loading={loading}
                searchKey="name"
                searchPlaceholder="Search tours..."
                rightActions={
                    <Button onClick={openCreateForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Tour
                    </Button>
                }
            />

            {/* Create/Edit Form Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent
                    className="w-full sm:max-w-xl flex flex-col p-0 h-full"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <SheetHeader className="border-b">
                        <SheetTitle>{isEditing ? "Edit Tour" : "Create New Tour"}</SheetTitle>
                        <SheetDescription>
                            {isEditing ? "Update the tour details" : "Fill in the details to create a new tour"}
                        </SheetDescription>
                    </SheetHeader>

                    {/* Step Progress Indicator */}
                    <div className="px-4 border-b">
                        <div className="flex items-start justify-between mb-2">
                            {[1, 2, 3].map((step) => (
                                <React.Fragment key={step}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep === step
                                                ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                                : currentStep > step
                                                    ? "bg-primary/80 text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {step}
                                        </div>
                                        <span className={`text-xs font-medium ${currentStep >= step ? "text-foreground" : "text-muted-foreground"}`}>
                                            {step === 1 ? "Content" : step === 2 ? "Media" : step === 3 ? "Itinerary" : "SEO"}
                                        </span>
                                    </div>
                                    {step < 3 && (
                                        <div className={`flex-1 h-0.5 mx-2 mt-3 transition-all ${currentStep > step ? "bg-primary" : "bg-muted"}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <ScrollArea className="flex-1 overflow-y-auto">
                        <div className="px-4">
                            {/* Step 1: Content */}
                            {currentStep === 1 && (
                                <div className="space-y-6 animate-in fade-in-50 duration-300">
                                    <div className="border rounded-md p-4 space-y-4 shadow-sm bg-card">
                                        <h3 className="text-lg font-semibold">Basic Information</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Tour Name *<p className="text-xs text-muted-foreground">{slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}</p></Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="e.g., Golden Triangle Tour"
                                                    disabled={isEditing}
                                                />
                                                {/* SEO Indicator for Name */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={`font-medium ${formData.name.length === 0 ? 'text-muted-foreground' :
                                                            formData.name.length >= 50 && formData.name.length <= 60 ? 'text-green-600' :
                                                                formData.name.length > 60 ? 'text-red-600' :
                                                                    'text-amber-600'
                                                            }`}>
                                                            {formData.name.length === 0 ? 'SEO Title Length' :
                                                                formData.name.length >= 50 && formData.name.length <= 60 ? 'Optimal ✓' :
                                                                    formData.name.length > 60 ? 'Too Long' :
                                                                        'Too Short'}
                                                        </span>
                                                        <span className="text-muted-foreground">{formData.name.length} / 50-60</span>
                                                    </div>
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${formData.name.length >= 50 && formData.name.length <= 60 ? 'bg-green-500' :
                                                                formData.name.length > 60 ? 'bg-red-500' :
                                                                    'bg-amber-500'
                                                                }`}
                                                            style={{ width: `${Math.min((formData.name.length / 60) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description (SEO Meta) *</Label>
                                                <Textarea
                                                    id="description"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Describe the tour..."
                                                    rows={4}
                                                />
                                                {/* SEO Indicator for Description */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={`font-medium ${(formData.description?.length ?? 0) === 0 ? 'text-muted-foreground' :
                                                            (formData.description?.length ?? 0) >= 150 && (formData.description?.length ?? 0) <= 160 ? 'text-green-600' :
                                                                (formData.description?.length ?? 0) > 160 ? 'text-red-600' :
                                                                    'text-amber-600'
                                                            }`}>
                                                            {(formData.description?.length ?? 0) === 0 ? 'Meta Description Length' :
                                                                (formData.description?.length ?? 0) >= 150 && (formData.description?.length ?? 0) <= 160 ? 'Optimal ✓' :
                                                                    (formData.description?.length ?? 0) > 160 ? 'Too Long' :
                                                                        'Too Short'}
                                                        </span>
                                                        <span className="text-muted-foreground">{formData.description?.length || 0} / 150-160</span>
                                                    </div>
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-300 ${(formData.description?.length ?? 0) >= 150 && (formData.description?.length ?? 0) <= 160 ? 'bg-green-500' :
                                                                (formData.description?.length ?? 0) > 160 ? 'bg-red-500' :
                                                                    'bg-amber-500'
                                                                }`}
                                                            style={{ width: `${Math.min(((formData.description?.length || 0) / 160) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Keywords (Max 3)</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={keywordInput}
                                                        onChange={(e) => setKeywordInput(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                                        placeholder="Enter keyword"
                                                        disabled={(seoKeywords ? seoKeywords.split(',').map(s => s.trim()).filter(Boolean) : []).length >= 3}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={handleAddKeyword}
                                                        disabled={(seoKeywords ? seoKeywords.split(',').map(s => s.trim()).filter(Boolean) : []).length >= 3 || !keywordInput.trim()}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {(seoKeywords ? seoKeywords.split(',').map(s => s.trim()).filter(Boolean) : []).map((keyword, index) => (
                                                        <Badge key={index} variant="secondary" className="px-2 py-1 gap-1">
                                                            {keyword}
                                                            <X
                                                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                                onClick={() => removeKeyword(index)}
                                                            />
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {(seoKeywords ? seoKeywords.split(',').map(s => s.trim()).filter(Boolean) : []).length}/3 keywords used.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-md p-4 space-y-4 shadow-sm bg-card">
                                        <h3 className="text-lg font-semibold">Pricing & Duration</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="price">Base Price ($) *</Label>
                                                <Input
                                                    id="price"
                                                    type="number"
                                                    value={formData.price || ""}
                                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                                    placeholder="250"
                                                />
                                                <p className="text-xs text-muted-foreground">{formData.variants.length > 0 ? "Starting/Base price" : "Tour price"}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Duration in Days</Label>
                                                <Select
                                                    value={formData.duration}
                                                    onValueChange={(v) => setFormData({ ...formData, duration: v })}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select duration" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 20 }, (_, i) => i + 1).map((day) => (
                                                            <SelectItem key={day} value={`${day} Days`}>
                                                                {day} {day === 1 ? "Day" : "Days"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-base font-medium">Pricing Variants</Label>
                                                    <p className="text-xs text-muted-foreground">Add multiple pricing options (e.g. Luxury, Standard, Per Person)</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newVariant = { name: "", price: 0 };
                                                        setFormData({ ...formData, variants: [...formData.variants, newVariant] });
                                                    }}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" /> Add Variant
                                                </Button>
                                            </div>

                                            {formData.variants.length === 0 && (
                                                <div className="text-sm text-muted-foreground text-center py-4 border-dashed border rounded-md bg-muted/50">
                                                    No variants added. The base price will be displayed.
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                {formData.variants.map((variant, index) => (
                                                    <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1">
                                                        <Input
                                                            placeholder="Variant Name (e.g. Standard Package)"
                                                            value={variant.name}
                                                            onChange={(e) => {
                                                                const newVariants = [...formData.variants];
                                                                newVariants[index].name = e.target.value;
                                                                setFormData({ ...formData, variants: newVariants });
                                                            }}
                                                            className="flex-1"
                                                        />
                                                        <div className="relative w-32 shrink-0">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                            <Input
                                                                type="number"
                                                                placeholder="Price"
                                                                value={variant.price || ""}
                                                                onChange={(e) => {
                                                                    const newVariants = [...formData.variants];
                                                                    newVariants[index].price = Number(e.target.value);
                                                                    setFormData({ ...formData, variants: newVariants });
                                                                }}
                                                                className="pl-6"
                                                            />
                                                        </div>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                            onClick={() => {
                                                                const newVariants = formData.variants.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, variants: newVariants });
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border rounded-md p-4 space-y-4 shadow-sm bg-card">
                                        <h3 className="text-lg font-semibold">Tour Settings</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Select
                                                    value={formData.category}
                                                    onValueChange={(v: TourCategory) => setFormData({ ...formData, category: v })}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select Category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((c) => (
                                                            <SelectItem key={c._id} value={c.slug}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Tour Type (Optional)</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                                            {formData.tourType || "Select type..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search type..." />
                                                            <CommandList>
                                                                <CommandEmpty>No tour type found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {tourTypes.map((t) => (
                                                                        <CommandItem
                                                                            key={t._id}
                                                                            onSelect={() => {
                                                                                setFormData(prev => ({ ...prev, tourType: prev.tourType === t.name ? undefined : t.name }));
                                                                            }}
                                                                        >
                                                                            <Check className={cn("mr-2 h-4 w-4", formData.tourType === t.name ? "opacity-100" : "opacity-0")} />
                                                                            {t.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                                <CommandSeparator />
                                                                <CommandGroup>
                                                                    <CommandItem onSelect={() => setIsTourTypesSheetOpen(true)}>
                                                                        <Settings2 className="mr-2 h-4 w-4" />
                                                                        Manage Tour Types
                                                                    </CommandItem>
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Difficulty</Label>
                                                <Select
                                                    value={formData.difficulty}
                                                    onValueChange={(v: TourDifficulty) => setFormData({ ...formData, difficulty: v })}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DIFFICULTIES.map((d) => (
                                                            <SelectItem key={d.value} value={d.value}>
                                                                {d.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="featured">Featured Tour</Label>
                                                <Select
                                                    value={formData.featured ? "true" : "false"}
                                                    onValueChange={(v) => setFormData({ ...formData, featured: v === "true" })}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="false">No</SelectItem>
                                                        <SelectItem value="true">Yes</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                        </div>
                                    </div>

                                    <div className="border rounded-md p-4 space-y-4 shadow-sm bg-card">
                                        <h3 className="text-lg font-semibold">Inclusions & Exclusions</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Inclusions</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                                            {formData.inclusions.length > 0 ? `${formData.inclusions.length} selected` : "Select inclusions..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search inclusion..." />
                                                            <CommandList>
                                                                <CommandEmpty>No inclusion found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {inclusions.map((item) => (
                                                                        <CommandItem key={item._id} onSelect={() => toggleInclusion(item.name)}>
                                                                            <Check className={cn("mr-2 h-4 w-4", formData.inclusions.includes(item.name) ? "opacity-100" : "opacity-0")} />
                                                                            {item.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                                <CommandSeparator />
                                                                <CommandGroup>
                                                                    <CommandItem onSelect={() => setIsInclusionsSheetOpen(true)}>
                                                                        <Settings2 className="mr-2 h-4 w-4" />
                                                                        Manage Inclusions
                                                                    </CommandItem>
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Exclusions</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                                            {formData.exclusions.length > 0 ? `${formData.exclusions.length} selected` : "Select exclusions..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search exclusion..." />
                                                            <CommandList>
                                                                <CommandEmpty>No exclusion found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {exclusions.map((item) => (
                                                                        <CommandItem key={item._id} onSelect={() => toggleExclusion(item.name)}>
                                                                            <Check className={cn("mr-2 h-4 w-4", formData.exclusions.includes(item.name) ? "opacity-100" : "opacity-0")} />
                                                                            {item.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                                <CommandSeparator />
                                                                <CommandGroup>
                                                                    <CommandItem onSelect={() => setIsExclusionsSheetOpen(true)}>
                                                                        <Settings2 className="mr-2 h-4 w-4" />
                                                                        Manage Exclusions
                                                                    </CommandItem>
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Media */}
                            {currentStep === 2 && (
                                <div className="space-y-6 animate-in fade-in-50 duration-300">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Cover Image</h3>
                                        <div className="space-y-3">
                                            {formData.coverImage ? (
                                                <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                                    <Image
                                                        src={formData.coverImage.url}
                                                        alt={formData.coverImage.alt}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2 h-8 w-8"
                                                        onClick={removeCoverImage}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-32 border-dashed"
                                                    onClick={() => openMediaPicker("cover")}
                                                >
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <ImageIcon className="h-8 w-8" />
                                                        <span>Select Cover Image</span>
                                                    </div>
                                                </Button>
                                            )}
                                            {formData.coverImage && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openMediaPicker("cover")}
                                                >
                                                    Change Cover Image
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold">Gallery Images</h3>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openMediaPicker("gallery")}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Images
                                            </Button>
                                        </div>
                                        {formData.images.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {formData.images.map((img, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                                                    >
                                                        <Image
                                                            src={img.url}
                                                            alt={img.alt}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeGalleryImage(img.url)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">No gallery images selected</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="video">YouTube/Vimeo URL (Optional)</Label>
                                            <Input
                                                id="video"
                                                value={formData.video || ""}
                                                onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                                                placeholder="https://www.youtube.com/watch?v=..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Itinerary */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in-50 duration-300">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Tour Itinerary</h3>

                                        {/* Existing Itinerary Items */}
                                        {formData.itinerary.length > 0 && (
                                            <div className="space-y-3 mb-6">
                                                {formData.itinerary.map((item, index) => (
                                                    <div key={index} className="border rounded-lg p-4 space-y-3">
                                                        {editingItineraryIndex === index ? (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label>Time</Label>
                                                                        <Input value={tempEditingItinerary.time || ""} onChange={(e) => setTempEditingItinerary({ ...tempEditingItinerary, time: e.target.value })} placeholder="e.g. 1 Hour" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Title</Label>
                                                                        <Input value={tempEditingItinerary.title || ""} onChange={(e) => setTempEditingItinerary({ ...tempEditingItinerary, title: e.target.value })} />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Description</Label>
                                                                    <Textarea value={tempEditingItinerary.description || ""} onChange={(e) => setTempEditingItinerary({ ...tempEditingItinerary, description: e.target.value })} rows={3} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Location</Label>
                                                                    <LocationSearch
                                                                        onLocationSelect={(loc) => setTempEditingItinerary({ ...tempEditingItinerary, location: loc })}
                                                                        initialValue={tempEditingItinerary.location?.name || ""}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Image (Optional)</Label>
                                                                    <div className="flex items-center gap-4">
                                                                        {tempEditingItinerary.image ? (
                                                                            <div className="relative h-20 w-32 rounded-md overflow-hidden border">
                                                                                <Image src={tempEditingItinerary.image.url} alt={tempEditingItinerary.image.alt} fill className="object-cover" />
                                                                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setTempEditingItinerary({ ...tempEditingItinerary, image: undefined })}>
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <Button variant="outline" size="sm" onClick={() => { setPickingFor("itinerary"); setIsMediaPickerOpen(true); }}>
                                                                                <ImageIcon className="mr-2 h-4 w-4" /> Select Image
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2 justify-end">
                                                                    <Button variant="ghost" onClick={() => setEditingItineraryIndex(null)}>Cancel</Button>
                                                                    <Button onClick={() => {
                                                                        const updatedItinerary = [...formData.itinerary];
                                                                        // Ensure mandatory fields are present, though in this simple edit we assume they are if pre-existing
                                                                        if (!tempEditingItinerary.title || !tempEditingItinerary.description) {
                                                                            toast.error("Title and description required");
                                                                            return;
                                                                        }
                                                                        updatedItinerary[index] = tempEditingItinerary as ItineraryDay;
                                                                        setFormData({ ...formData, itinerary: updatedItinerary });
                                                                        setEditingItineraryIndex(null);
                                                                        toast.success("Updated");
                                                                    }}>Save</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Display View */
                                                            <>
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <h4 className="font-semibold">{item.title} <Badge variant="secondary">{item.time} Hours</Badge></h4>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                                                        {item.location && (
                                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                                                                <MapPin className="h-3 w-3" />
                                                                                <span>{item.location.displayName}</span>
                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                setTempEditingItinerary(item);
                                                                                setEditingItineraryIndex(index);
                                                                            }}
                                                                        >
                                                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    itinerary: formData.itinerary.filter((_, i) => i !== index)
                                                                                });
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className={`grid gap-4 mt-4 ${item.image && item.location ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                                    {item.image && (
                                                                        <div className="relative aspect-video rounded-md overflow-hidden">
                                                                            <Image
                                                                                src={item.image.url}
                                                                                alt={item.image.alt}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {item.location && (
                                                                        <div className="relative aspect-video rounded-md overflow-hidden border bg-muted">
                                                                            <LocationMap
                                                                                latitude={item.location.coordinates.lat}
                                                                                longitude={item.location.coordinates.lon}
                                                                                locationName={item.location.name}
                                                                                height="100%"
                                                                                className="h-full w-full"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add New Itinerary Item */}
                                        <div className="border-2 border-dashed rounded-lg p-6 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold">Add Itinerary Item</h4>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Time (Hours)</Label>
                                                    <Input
                                                        type="number"
                                                        value={currentItinerary.time || ""}
                                                        onChange={(e) => setCurrentItinerary({
                                                            ...currentItinerary,
                                                            time: e.target.value
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Title</Label>
                                                    <Input
                                                        value={currentItinerary.title || ""}
                                                        onChange={(e) => setCurrentItinerary({
                                                            ...currentItinerary,
                                                            title: e.target.value
                                                        })}
                                                        placeholder="e.g., Explore Taj Mahal"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Textarea
                                                    value={currentItinerary.description || ""}
                                                    onChange={(e) => setCurrentItinerary({
                                                        ...currentItinerary,
                                                        description: e.target.value
                                                    })}
                                                    placeholder="Describe this day's activities..."
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Location (Optional)</Label>
                                                <LocationSearch
                                                    onLocationSelect={(location) => {
                                                        setCurrentItinerary({
                                                            ...currentItinerary,
                                                            location
                                                        });
                                                    }}
                                                    placeholder="Search for a location..."
                                                    initialValue={currentItinerary.location?.name || ""}
                                                />
                                                {currentItinerary.location && (
                                                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <MapPin className="h-3 w-3" />
                                                            <span>{currentItinerary.location.displayName}</span>
                                                        </div>
                                                        <div className="mt-2">
                                                            <LocationMap
                                                                latitude={currentItinerary.location.coordinates.lat}
                                                                longitude={currentItinerary.location.coordinates.lon}
                                                                locationName={currentItinerary.location.name}
                                                                height="200px"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Image (Optional)</Label>
                                                {currentItinerary.image ? (
                                                    <div className="relative aspect-video rounded-lg overflow-hidden border">
                                                        <Image
                                                            src={currentItinerary.image.url}
                                                            alt={currentItinerary.image.alt}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-2 right-2 h-8 w-8"
                                                            onClick={() => setCurrentItinerary({
                                                                ...currentItinerary,
                                                                image: undefined
                                                            })}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => {
                                                            setPickingFor("itinerary");
                                                            setIsMediaPickerOpen(true);
                                                        }}
                                                    >
                                                        <ImageIcon className="mr-2 h-4 w-4" />
                                                        Select Image
                                                    </Button>
                                                )}
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    // Ensure mandatory fields are present
                                                    if (!currentItinerary.time || !currentItinerary.title || !currentItinerary.description) {
                                                        toast.error("Please fill in time, title and description");
                                                        return;
                                                    }

                                                    const newItem: ItineraryDay = {
                                                        time: currentItinerary.time,
                                                        title: currentItinerary.title,
                                                        description: currentItinerary.description,
                                                        image: currentItinerary.image,
                                                        location: currentItinerary.location,
                                                    };

                                                    setFormData({
                                                        ...formData,
                                                        itinerary: [...formData.itinerary, newItem]
                                                    });
                                                    toast.success("Itinerary item added");

                                                    // Reset form
                                                    setCurrentItinerary({
                                                        time: "",
                                                        title: "",
                                                        description: "",
                                                    });
                                                }}
                                                className="w-full"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </ScrollArea >

                    <SheetFooter className="border-t mt-auto">
                        <div className="flex items-center justify-between w-full gap-2">
                            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                                Cancel
                            </Button>
                            <div className="flex gap-2">
                                {currentStep > 1 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                    >
                                        Previous
                                    </Button>
                                )}
                                {currentStep < totalSteps ? (
                                    <Button onClick={() => setCurrentStep(currentStep + 1)}>
                                        Next
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditing ? "Update Tour" : "Create Tour"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </SheetFooter>
                </SheetContent >
            </Sheet >

            {/* Media Picker Dialog */}
            {/* Media Picker Dialog */}
            < MediaPickerDialog
                open={isMediaPickerOpen}
                onOpenChange={setIsMediaPickerOpen}
                onSelect={handleMediaSelect}
                mode={pickingFor === "gallery" ? "multiple" : "single"}
                initialSelected={
                    pickingFor === "cover"
                        ? (formData.coverImage ? [formData.coverImage.url] : [])
                        : pickingFor === "itinerary"
                            ? (editingItineraryIndex !== null
                                ? (tempEditingItinerary.image ? [tempEditingItinerary.image.url] : [])
                                : (currentItinerary.image ? [currentItinerary.image.url] : [])
                            )
                            : formData.images.map(img => img.url)
                }
                title={pickingFor === "cover" ? "Select Cover Image" : pickingFor === "itinerary" ? "Select Itinerary Image" : "Select Gallery Images"}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tour</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedTour?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Manage Inclusions Sheet */}
            <Sheet open={isInclusionsSheetOpen} onOpenChange={setIsInclusionsSheetOpen}>
                <SheetContent side="right">
                    <SheetHeader className="border-b">
                        <SheetTitle>Manage Inclusions</SheetTitle>
                        <SheetDescription>Add or remove inclusions available for tours.</SheetDescription>
                    </SheetHeader>
                    <div className="px-4 space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New Inclusion..."
                                value={newInclusionName}
                                onChange={(e) => setNewInclusionName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateInclusion()}
                            />
                            <Button onClick={handleCreateInclusion} size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <ScrollArea className="h-[500px] border rounded-md p-2">
                            {inclusions.map((item) => (
                                <div key={item._id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md group">
                                    {editingInclusion?.id === item._id ? (
                                        <div className="flex flex-1 items-center gap-2">
                                            <Input
                                                value={editingInclusion.name}
                                                onChange={(e) => setEditingInclusion({ ...editingInclusion, name: e.target.value })}
                                                className="h-8"
                                            />
                                            <Button size="icon" className="h-8 w-8" onClick={handleUpdateInclusion}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingInclusion(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{item.name}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setEditingInclusion({ id: item._id, name: item.name })}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDeleteInclusion(item._id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {inclusions.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No inclusions yet.</p>
                            )}
                        </ScrollArea>
                    </div>
                    <SheetFooter className="border-t">
                        <Button onClick={() => setIsInclusionsSheetOpen(false)}>Close</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Manage Exclusions Sheet */}
            <Sheet open={isExclusionsSheetOpen} onOpenChange={setIsExclusionsSheetOpen}>
                <SheetContent side="right">
                    <SheetHeader className="border-b">
                        <SheetTitle>Manage Exclusions</SheetTitle>
                        <SheetDescription>Add or remove exclusions available for tours.</SheetDescription>
                    </SheetHeader>
                    <div className="px-4 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New Exclusion..."
                                value={newExclusionName}
                                onChange={(e) => setNewExclusionName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateExclusion()}
                            />
                            <Button onClick={handleCreateExclusion} size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <ScrollArea className="h-[500px] border rounded-md p-2">
                            {exclusions.map((item) => (
                                <div key={item._id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md group">
                                    {editingExclusion?.id === item._id ? (
                                        <div className="flex flex-1 items-center gap-2">
                                            <Input
                                                value={editingExclusion.name}
                                                onChange={(e) => setEditingExclusion({ ...editingExclusion, name: e.target.value })}
                                                className="h-8"
                                            />
                                            <Button size="icon" className="h-8 w-8" onClick={handleUpdateExclusion}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingExclusion(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span>{item.name}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setEditingExclusion({ id: item._id, name: item.name })}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDeleteExclusion(item._id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {exclusions.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No exclusions yet.</p>
                            )}
                        </ScrollArea>
                    </div>
                    <SheetFooter className="border-t">
                        <Button onClick={() => setIsExclusionsSheetOpen(false)}>Close</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Manage Tour Types Sheet */}
            <Sheet open={isTourTypesSheetOpen} onOpenChange={setIsTourTypesSheetOpen}>
                <SheetContent side="right">
                    <SheetHeader className="border-b">
                        <SheetTitle>Manage Tour Types</SheetTitle>
                        <SheetDescription>Add or remove tour types.</SheetDescription>
                    </SheetHeader>
                    <div className="px-4 space-y-4">
                        <div className="flex gap-2 pt-4">
                            <Input
                                placeholder="New Tour Type..."
                                value={newTourTypeName}
                                onChange={(e) => setNewTourTypeName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateTourType()}
                            />
                            <Button size="icon" onClick={handleCreateTourType}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <ScrollArea className="h-[400px] border rounded-md p-2">
                            {tourTypes.map((item) => (
                                <div key={item._id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md group">
                                    {editingTourType?.id === item._id ? (
                                        <div className="flex flex-1 items-center gap-2">
                                            <Input
                                                value={editingTourType.name}
                                                onChange={(e) => setEditingTourType({ ...editingTourType, name: e.target.value })}
                                                className="h-8"
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleUpdateTourType}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingTourType(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm">{item.name}</span>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground"
                                                    onClick={() => setEditingTourType({ id: item._id, name: item.name })}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => handleDeleteTourType(item._id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {tourTypes.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No tour types yet.</p>
                            )}
                        </ScrollArea>
                    </div>
                    <SheetFooter className="border-t">
                        <Button onClick={() => setIsTourTypesSheetOpen(false)}>Close</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div >
    );
};

export default ToursPage;