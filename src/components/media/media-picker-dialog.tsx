"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Check, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { MediaItem } from "@/types/media";

interface MediaPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (selected: MediaItem[]) => void;
    mode?: "single" | "multiple";
    initialSelected?: string[];
    title?: string;
}

export function MediaPickerDialog({
    open,
    onOpenChange,
    onSelect,
    mode = "single",
    initialSelected = [],
    title = "Select Media",
}: MediaPickerDialogProps) {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 9;

    const [selectedUrls, setSelectedUrls] = useState<string[]>(initialSelected);

    useEffect(() => {
        if (open) {
            setSelectedUrls(initialSelected || []);
        }
    }, [open, initialSelected]);

    useEffect(() => {
        if (open) {
            fetchMedia(search, page);
        }
    }, [open, search, page]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const fetchMedia = async (searchTerm: string, pageNum: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: LIMIT.toString(),
                page: pageNum.toString(),
                search: searchTerm,
            });
            const res = await fetch(`/api/protected/media?${params}`);
            const data = await res.json();

            const images = (data.media || []).filter((m: MediaItem) =>
                m.type?.startsWith("image/")
            );

            setMediaItems(images);
            if (data.pagination) {
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch media:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (media: MediaItem) => {
        if (mode === "single") {
            setSelectedUrls([media.url]);
        } else {
            if (selectedUrls.includes(media.url)) {
                setSelectedUrls(prev => prev.filter(url => url !== media.url));
            } else {
                setSelectedUrls(prev => [...prev, media.url]);
            }
        }
    };

    const handleConfirm = () => {
        const selectedObjects = selectedUrls.map(url => {
            const found = mediaItems.find(item => item.url === url);
            if (found) return found;
            return { _id: "unknown", url, name: "Selected Image", type: "image/jpeg", createdAt: new Date().toISOString() } as MediaItem;
        });

        onSelect(selectedObjects);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="h-[85vh] w-[90vw] p-0 gap-0 flex! flex-col! overflow-hidden"
            >
                <DialogHeader className="p-4 border-b shrink-0 space-y-1">
                    <div>
                        <DialogTitle className="text-xl">{title}</DialogTitle>
                        <DialogDescription className="sr-only">Select images from your media library</DialogDescription>
                    </div>
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search images..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 bg-neutral-50/50 overflow-y-auto">
                    <div className="p-4">
                        {loading ? (
                            <div className="grid grid-cols-3 gap-3">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <Skeleton key={i} className="aspect-square rounded-lg" />
                                ))}
                            </div>
                        ) : mediaItems.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {mediaItems.map((media) => {
                                    const isSelected = selectedUrls.includes(media.url);
                                    return (
                                        <div
                                            key={media._id}
                                            onClick={() => toggleSelection(media)}
                                            className={`
                                                group relative aspect-square rounded-lg cursor-pointer overflow-hidden border-2 transition-all duration-200
                                                ${isSelected
                                                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md scale-[0.98]"
                                                    : "border-transparent bg-white shadow-sm hover:border-primary/50 hover:shadow-md"
                                                }
                                            `}
                                        >
                                            <Image
                                                src={media.url}
                                                alt={media.name}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />

                                            <div className={`
                                                absolute inset-0 transition-opacity duration-200 flex items-center justify-center
                                                ${isSelected ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0 group-hover:opacity-100"}
                                            `}>
                                                {isSelected && (
                                                    <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                                                        <Check className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-8">
                                                <p className="text-xs font-medium text-white truncate">{media.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                                <p>No images found matching your search.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t bg-white shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                                {selectedUrls.length} image{selectedUrls.length !== 1 ? 's' : ''} selected
                            </div>

                            <div className="flex items-center gap-2 border-l pl-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || loading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages || loading}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} disabled={selectedUrls.length === 0}>
                                Select {selectedUrls.length > 0 && `(${selectedUrls.length})`}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
