"use client";

import React, { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
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
import Image from "next/image";
import type { Category, CategoryFormData } from "@/types/category";
import { MediaPickerDialog } from "@/components/media/media-picker-dialog";
import type { MediaItem } from "@/types/media";
import { ScrollArea } from "@/components/ui/scroll-area";

const CategoriesPage = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Media picker state
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

    const [formData, setFormData] = useState<CategoryFormData>({
        name: "",
        description: "",
        slug: "",
        imageUrl: "",
    });

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/protected/categories?limit=1000");
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const openCreate = () => {
        setFormData({ name: "", description: "", slug: "", imageUrl: "" });
        setIsEditing(false);
        setIsSheetOpen(true);
    };

    const openEdit = (cat: Category) => {
        setFormData({
            name: cat.name,
            description: cat.description || "",
            slug: cat.slug,
            imageUrl: cat.imageUrl || "",
        });
        setSelectedCategory(cat);
        setIsEditing(true);
        setIsSheetOpen(true);
    };

    const handleMediaSelect = (selected: MediaItem[]) => {
        if (selected.length > 0) {
            setFormData({ ...formData, imageUrl: selected[0].url });
        }
    };

    const handleSave = async () => {
        if (!formData.name) return toast.error("Name is required");

        setIsSaving(true);
        try {
            const url = isEditing ? `/api/protected/categories/${selectedCategory?._id}` : "/api/protected/categories";
            const method = isEditing ? "PUT" : "POST";

            // Auto-generate slug if empty
            const payload = {
                ...formData,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(isEditing ? "Category updated" : "Category created");
            setIsSheetOpen(false);
            fetchCategories();
        } catch (e) {
            toast.error("Error saving category");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/protected/categories/${selectedCategory._id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Category deleted");
            setIsDeleteOpen(false);
            fetchCategories();
        } catch (e) {
            toast.error("Error deleting category");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleReorder = async (newOrder: Category[]) => {
        setCategories(newOrder); // Optimistic update
        try {
            const res = await fetch("/api/protected/categories/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categories: newOrder.map((cat, index) => ({ _id: cat._id, sequence: index + 1 }))
                }),
            });
            if (!res.ok) throw new Error("Failed to save order");
            toast.success("Order updated");
        } catch (e) {
            toast.error("Failed to save order");
            fetchCategories(); // Revert
        }
    };

    const columns: ColumnDef<Category>[] = [
        {
            accessorKey: "imageUrl",
            header: "Image",
            cell: ({ row }) => (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                    {row.original.imageUrl ? (
                        <Image src={row.original.imageUrl} alt={row.original.name} fill className="object-cover" />
                    ) : (
                        <ImageIcon className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground" />
                    )}
                </div>
            )
        },
        {
            accessorKey: "name",
            header: "Title",
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="font-medium truncate block" title={row.original.name}>
                        {row.original.name}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="text-sm text-muted-foreground truncate block" title={row.original.description || ''}>
                        {row.original.description || '-'}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "slug",
            header: "Slug",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm font-mono">
                    {row.original.slug}
                </span>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(row.original)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => { setSelectedCategory(row.original); setIsDeleteOpen(true); }} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-2 p-6">
            <DataTable columns={columns} data={categories} loading={loading} searchKey="name"
                enableReordering={true}
                onReorder={handleReorder}
                leftActions={
                    <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
                } />
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg">
                    <SheetHeader className="border-b">
                        <SheetTitle>{isEditing ? "Edit Category" : "New Category"}</SheetTitle>
                        <SheetDescription>Category details and SEO.</SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="overflow-y-auto">
                        <div className="flex flex-col gap-4 px-4">
                            <div className="flex flex-col gap-1">
                                <Label>Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Adventure" />
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
                            <div className="flex flex-col gap-1">
                                <Label>Slug (Auto-generated)</Label>
                                <Input
                                    value={formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                                    readOnly
                                    className="bg-muted cursor-not-allowed"
                                    placeholder="slug-will-appear-here"
                                />
                                <p className="text-xs text-muted-foreground">
                                    URL: /{formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'slug'}/product-name
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
                                {/* SEO Indicator for Description */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={`font-medium ${(formData.description?.length ?? 0) === 0 ? 'text-muted-foreground' :
                                            (formData.description?.length ?? 0) >= 150 && (formData.description?.length ?? 0) <= 160 ? 'text-green-600' :
                                                (formData.description?.length ?? 0) > 160 ? 'text-red-600' :
                                                    'text-amber-600'
                                            }`}>
                                            {(formData.description?.length ?? 0) === 0 ? 'SEO Description Length' :
                                                (formData.description?.length ?? 0) >= 150 && (formData.description?.length ?? 0) <= 160 ? 'Optimal ✓' :
                                                    (formData.description?.length ?? 0) > 160 ? 'Too Long' :
                                                        'Too Short'}
                                        </span>
                                        <span className="text-muted-foreground">{formData.description?.length ?? 0} / 150-160</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${(formData.description?.length ?? 0) >= 150 && (formData.description?.length ?? 0) <= 160 ? 'bg-green-500' :
                                                (formData.description?.length ?? 0) > 160 ? 'bg-red-500' :
                                                    'bg-amber-500'
                                                }`}
                                            style={{ width: `${Math.min(((formData.description?.length ?? 0) / 160) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label>Image</Label>
                                {formData.imageUrl ? (
                                    <div className="relative aspect-video rounded-md overflow-hidden border">
                                        <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setFormData({ ...formData, imageUrl: "" })}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full h-32 border-dashed flex flex-col gap-2"
                                        onClick={() => setIsMediaPickerOpen(true)}
                                    >
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        <span className="text-muted-foreground">Select from Media Library</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                    <SheetFooter className="border-t">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                        </Button>
                        <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <MediaPickerDialog
                open={isMediaPickerOpen}
                onOpenChange={setIsMediaPickerOpen}
                onSelect={handleMediaSelect}
                mode="single"
                initialSelected={formData.imageUrl ? [formData.imageUrl] : []}
                title="Select Category Image"
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default CategoriesPage;
