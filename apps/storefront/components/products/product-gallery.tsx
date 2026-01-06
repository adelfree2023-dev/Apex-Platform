"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ProductAsset {
    id?: string;
    preview: string;
}

interface ProductGalleryProps {
    images: ProductAsset[];
    productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);

    // Fallback if no images
    if (!images || images.length === 0) {
        return (
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
            </div>
        );
    }

    const selectedImage = images[selectedIndex];

    const goToPrevious = () => {
        setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
                <Image
                    src={selectedImage.preview}
                    alt={`${productName} - Image ${selectedIndex + 1}`}
                    fill
                    className={cn(
                        "object-cover transition-transform duration-500",
                        isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in hover:scale-105"
                    )}
                    onClick={() => setIsZoomed(!isZoomed)}
                    priority
                />

                {/* Zoom Indicator */}
                <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ZoomIn className="h-5 w-5 text-gray-700" />
                </button>

                {/* Navigation Arrows - Only show if multiple images */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                            <ChevronRight className="h-5 w-5 text-gray-700" />
                        </button>
                    </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
                        {selectedIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnail Strip - Only show if multiple images */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                                selectedIndex === index
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-transparent hover:border-gray-300"
                            )}
                        >
                            <Image
                                src={image.preview}
                                alt={`${productName} thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
