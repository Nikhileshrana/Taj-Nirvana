"use client";

import { useState } from "react";
import Image from "next/image";
import { TourImage } from "@/types/tour";
import { ImageIcon, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose,
    DialogTitle,
    DialogHeader,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

interface TourGalleryProps {
    coverImage: TourImage;
    images: TourImage[];
    name: string;
}

export function TourGallery({ coverImage, images, name }: TourGalleryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialSlide, setInitialSlide] = useState(0);

    if (!images || images.length === 0) {
        return <div className="h-[400px] bg-muted rounded-xl flex items-center justify-center">No Images Available</div>;
    }

    const secondaryImages = images.slice(0, 2);
    const remainingCount = Math.max(0, images.length - 2);

    const openGallery = (index: number) => {
        setInitialSlide(index);
        setIsOpen(true);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] rounded-xl overflow-hidden">
                {/* Main Large Image */}
                <div
                    className="relative h-full w-full group overflow-hidden cursor-pointer"
                    onClick={() => openGallery(0)}
                >
                    <Image
                        src={coverImage.url}
                        alt={coverImage.alt || name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                    />

                    {/* Badge for Mobile (Hidden on Desktop) */}
                    {images.length > 1 && (
                        <div className="md:hidden absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:bg-white transition-colors">
                            <ImageIcon className="w-4 h-4" />
                            <span>View all {images.length} photos</span>
                        </div>
                    )}
                </div>

                {/* Right Column - Stacked Images */}
                <div className="hidden md:flex flex-col gap-2 h-full">
                    {secondaryImages.map((img, index) => (
                        <div
                            key={index}
                            className="relative flex-1 group overflow-hidden cursor-pointer"
                            onClick={() => openGallery(index)}
                        >
                            <Image
                                src={img.url}
                                alt={img.alt || `${name} ${index + 2}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Show badge on the last distinct image slot if there are more images */}
                            {index === secondaryImages.length - 1 && remainingCount > 0 && (
                                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:bg-white transition-colors cursor-pointer">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>View all {remainingCount + 3} photos</span>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Fill if less than 2 secondary images? */}
                    {secondaryImages.length === 0 && (
                        <div className="flex-1 bg-muted flex items-center justify-center text-muted-foreground">
                            More photos coming soon
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="flex flex-col items-center justify-center rounded-4xl h-[70dvh] sm:h-[80dvh]">
                    {/* Accessible Title & Desc for Screen Readers (Visually Hidden or minimal) */}
                    <DialogHeader className="sr-only">
                        <DialogTitle>Image Gallery: {name}</DialogTitle>
                        <DialogDescription>Swipe to view all images</DialogDescription>
                    </DialogHeader>
                    <div className="w-full h-full flex items-center justify-center">
                        <Carousel
                            opts={{ startIndex: initialSlide, loop: true }}
                            className="w-full h-full [&>div]:h-full"
                        >
                            <CarouselContent className="h-full">
                                {images.map((img, idx) => (
                                    <CarouselItem key={idx} className="h-full flex items-center justify-center">
                                        <div className="relative w-full h-full max-h-[65vh]">
                                            <Image
                                                src={img.url}
                                                alt={img.alt || `${name} - Image ${idx + 1}`}
                                                fill
                                                className="object-contain "
                                                quality={100}
                                                priority={idx === initialSlide}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-4" />
                            <CarouselNext className="right-4" />
                        </Carousel>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
