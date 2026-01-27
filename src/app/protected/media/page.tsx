"use client"
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Trash2, Upload, Loader2, ImagePlus, Search, ChevronLeft, ChevronRight, X, Pencil, Save } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
// import { useDebounce } from "@/hooks/use-debounce" // We might need to implement this hook or just use local timeout

interface MediaItem {
    _id: string;
    url: string;
    name: string;
    type: string;
    createdAt: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const MediaPage = () => {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    // const [uploading, setUploading] = useState(false); // No longer needed, replaced by currentUploading

    // Pagination & Search States
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");

    // Simple debounce by using a useEffect with timeout
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    // Upload Queue State
    const [uploadQueue, setUploadQueue] = useState<{ file: File, preview: string, name: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentUploading, setCurrentUploading] = useState(false);

    // Edit/View State
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Ref to track queue for cleanup on unmount
    const queueRef = useRef(uploadQueue);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    // Reset page to 1 when search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchMedia();
    }, [page, debouncedSearch]);

    // Keep ref in sync with state
    useEffect(() => {
        queueRef.current = uploadQueue;
    }, [uploadQueue]);

    // Clean up previews ONLY on component unmount
    useEffect(() => {
        return () => {
            // Only revoke when the component is destroyed to prevent clearing active previews
            // which happens if we cleanup on every state change.
            queueRef.current.forEach(item => URL.revokeObjectURL(item.preview));
        };
    }, []);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                search: debouncedSearch
            });

            const res = await fetch(`/api/protected/media?${params}`);
            const data = await res.json();

            if (data.media) {
                setMedia(data.media);
                setTotalPages(data.pagination.totalPages);
            } else {
                setMedia([]); // Fallback
            }
        } catch (error) {
            console.error("Failed to fetch media", error);
            toast.error("Failed to fetch media");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Cleanup previous queue URLs if we are replacing them
        uploadQueue.forEach(item => URL.revokeObjectURL(item.preview));

        const newQueue = Array.from(files).map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name.split('.').slice(0, -1).join('.') || file.name // Default name without extension
        }));

        setUploadQueue(newQueue);
        setCurrentIndex(0);
        setIsDialogOpen(true);
        e.target.value = ""; // Reset input
    };

    const handleRemoveCurrent = () => {
        const newQueue = [...uploadQueue];
        if (newQueue[currentIndex]) {
            URL.revokeObjectURL(newQueue[currentIndex].preview);
            newQueue.splice(currentIndex, 1);
        }

        if (newQueue.length === 0) {
            setIsDialogOpen(false);
            setUploadQueue([]);
        } else {
            setUploadQueue(newQueue);
            // Adjust index if we removed the last item
            if (currentIndex >= newQueue.length) {
                setCurrentIndex(newQueue.length - 1);
            }
        }
    };

    const handleUploadNext = async () => {
        const currentItem = uploadQueue[currentIndex];
        if (!currentItem) return;

        // 4.5MB limit check
        if (currentItem.file.size > 4.5 * 1024 * 1024) {
            toast.error(`File ${currentItem.name} too large.Max 4.5MB`);
            handleRemoveCurrent(); // Remove the oversized file and move on
            return;
        }

        setCurrentUploading(true);

        try {
            // Read file as base64 for API
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(currentItem.file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
            });

            const res = await fetch('/api/protected/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    name: currentItem.name,
                    type: currentItem.file.type
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Upload failed");
            }

            toast.success(`Uploaded "${currentItem.name}"`);

            // Remove the uploaded item from the queue
            const updatedQueue = uploadQueue.filter((_, i) => i !== currentIndex);
            URL.revokeObjectURL(currentItem.preview); // Clean up preview for the uploaded item

            if (updatedQueue.length === 0) {
                toast.success("All files uploaded successfully");
                setIsDialogOpen(false);
                setUploadQueue([]);
                fetchMedia(); // Refresh grid
            } else {
                setUploadQueue(updatedQueue);
                // If the removed item was the last one, set index to the new last item
                if (currentIndex >= updatedQueue.length) {
                    setCurrentIndex(updatedQueue.length - 1);
                }
                // Otherwise, currentIndex remains the same, effectively moving to the next item in the new queue
            }

        } catch (error: any) {
            console.error("Error uploading", error);
            toast.error(error.message || `Failed to upload "${currentItem.name}"`);
            // We stay on current item so user can retry or skip
        } finally {
            setCurrentUploading(false);
        }
    };

    const updateCurrentName = (name: string) => {
        const newQueue = [...uploadQueue];
        if (newQueue[currentIndex]) {
            newQueue[currentIndex].name = name;
            setUploadQueue(newQueue);
        }
    };

    const handleDelete = async (id: string, url: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;

        try {
            const res = await fetch(`/api/protected/media?id=${id}&url=${encodeURIComponent(url)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success("Item deleted");
                // If checking last item on page, go back one page if possible
                if (media.length === 1 && page > 1) {
                    setPage(prev => prev - 1);
                } else {
                    fetchMedia();
                }
                setIsEditOpen(false); // Close edit dialog if open
            } else {
                toast.error("Failed to delete item");
            }
        } catch (err) {
            console.error("Error deleting item", err);
            toast.error("Error deleting item");
        }
    }

    const openEditDialog = (item: MediaItem) => {
        setSelectedItem(item);
        setEditName(item.name);
        setIsEditOpen(true);
    };

    const handleUpdateMedia = async () => {
        if (!selectedItem) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/protected/media', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedItem._id,
                    name: editName
                })
            });

            if (res.ok) {
                toast.success("Media updated successfully");
                fetchMedia();
                setIsEditOpen(false);
            } else {
                toast.error("Failed to update media");
            }
        } catch (error) {
            console.error("Error updating media", error);
            toast.error("Error updating media");
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="flex flex-1 flex-col gap-2 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">Media Gallery</h1>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search media..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={currentUploading} // Use currentUploading to disable the button during an upload
                        />
                        <Button disabled={currentUploading} className="shadow-none relative">
                            {currentUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            <span className="hidden sm:inline">Upload Media</span>
                            <span className="sm:hidden">Upload</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Upload Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (!open && uploadQueue.length > 0) {
                    if (confirm("Cancel remaining uploads?")) {
                        uploadQueue.forEach(item => URL.revokeObjectURL(item.preview)); // Clean up remaining previews
                        setUploadQueue([]);
                        setIsDialogOpen(false);
                    } else {
                        setIsDialogOpen(true); // Keep dialog open if user cancels
                    }
                } else {
                    setIsDialogOpen(open);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Media ({currentIndex + 1}/{uploadQueue.length})</DialogTitle>
                        <DialogDescription>
                            Review and name your media before uploading.
                        </DialogDescription>
                    </DialogHeader>

                    {uploadQueue.length > 0 && (
                        <div className="grid gap-4 py-4">
                            <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                                {uploadQueue[currentIndex].file.type.startsWith('video/') ? (
                                    <video
                                        src={uploadQueue[currentIndex].preview}
                                        className="max-h-full max-w-full object-contain"
                                        controls
                                    />
                                ) : (
                                    <img
                                        src={uploadQueue[currentIndex].preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                                    onClick={handleRemoveCurrent}
                                    title="Remove from queue"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name / Alt Text</Label>
                                <Input
                                    id="name"
                                    value={uploadQueue[currentIndex].name}
                                    onChange={(e) => updateCurrentName(e.target.value)}
                                    placeholder="Enter a descriptive name"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUploadNext();
                                    }}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Descriptive names improve accessibility and SEO.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex sm:justify-between gap-2">
                        <div className="flex-1 text-sm text-muted-foreground flex items-center">
                            {uploadQueue.length - 1 - currentIndex >= 0 ? `${uploadQueue.length - 1 - currentIndex} remaining` : '0 remaining'}
                        </div>
                        <Button variant="secondary" onClick={handleRemoveCurrent} disabled={currentUploading}>
                            Skip / Remove
                        </Button>
                        <Button onClick={handleUploadNext} disabled={currentUploading || !uploadQueue[currentIndex]?.name.trim()}>
                            {currentUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {currentIndex === uploadQueue.length - 1 ? 'Finish Upload' : 'Upload & Next'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit/View Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Media Details</DialogTitle>
                        <DialogDescription>
                            View, rename, or delete this media item.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="grid gap-4 py-4">
                            <div className="aspect-video relative rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                                {selectedItem.type.startsWith('video/') ? (
                                    <video
                                        src={selectedItem.url}
                                        className="max-h-full max-w-full object-contain"
                                        controls
                                    />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={selectedItem.url}
                                            alt={selectedItem.name}
                                            fill
                                            className="object-cover"
                                            sizes="100vw"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Name / Alt Text</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter name"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUpdateMedia();
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex justify-between gap-2 sm:justify-between">
                        <div className="flex gap-2">
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => selectedItem && handleDelete(selectedItem._id, selectedItem.url)}
                                disabled={isSaving}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateMedia} disabled={isSaving || !editName.trim()}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {media.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {media.map((item) => (
                                <Card
                                    key={item._id}
                                    className="group relative overflow-hidden aspect-square border-0 py-0 shadow-none bg-muted/30 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                    onClick={() => openEditDialog(item)}
                                >
                                    {item.type.startsWith('video/') ? (
                                        <video
                                            src={item.url}
                                            className="object-cover w-full h-full"
                                            muted
                                            playsInline
                                            onMouseOver={e => e.currentTarget.play()}
                                            onMouseOut={e => e.currentTarget.pause()}
                                        />
                                    ) : (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={item.url}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                            />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                        <p className="text-xs text-white truncate px-1">{item.name}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-full h-[300px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl gap-2">
                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                <ImagePlus className="h-6 w-6 opacity-50" />
                            </div>
                            <p className="font-medium">No media found</p>
                            <p className="text-sm text-muted-foreground/60 max-w-xs text-center">
                                {search ? `No results for "${search}"` : "Upload images or videos to get started."}
                            </p>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="flex items-center gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                                className="flex items-center gap-1"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default MediaPage