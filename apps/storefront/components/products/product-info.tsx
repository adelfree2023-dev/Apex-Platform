"use client";

import { Badge } from "@/components/ui/badge";
import { Star, Truck, Shield, RotateCcw } from "lucide-react";

interface ProductInfoProps {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    currencyCode: string;
    inStock: boolean;
    sku?: string;
}

export function ProductInfo({
    name,
    description,
    price,
    originalPrice,
    currencyCode,
    inStock,
    sku,
}: ProductInfoProps) {
    const formattedPrice = (price / 100).toFixed(2);
    const formattedOriginalPrice = originalPrice ? (originalPrice / 100).toFixed(2) : null;
    const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Stock Badge */}
            <div className="flex items-center gap-2">
                <Badge variant={inStock ? "default" : "destructive"}>
                    {inStock ? "In Stock" : "Out of Stock"}
                </Badge>
                {sku && (
                    <span className="text-xs text-gray-400">SKU: {sku}</span>
                )}
            </div>

            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                {name}
            </h1>

            {/* Rating (Placeholder) */}
            <div className="flex items-center gap-2">
                <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-5 w-5 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                    ))}
                </div>
                <span className="text-sm text-gray-500">(128 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                    {formattedPrice} {currencyCode}
                </span>
                {formattedOriginalPrice && (
                    <>
                        <span className="text-xl text-gray-400 line-through">
                            {formattedOriginalPrice} {currencyCode}
                        </span>
                        <Badge variant="destructive" className="ml-2">
                            -{discount}%
                        </Badge>
                    </>
                )}
            </div>

            {/* Description */}
            <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed">
                    {description || "No description available."}
                </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
                <div className="flex flex-col items-center text-center gap-1">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <span className="text-xs text-gray-500">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <span className="text-xs text-gray-500">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                    <RotateCcw className="h-5 w-5 text-gray-500" />
                    <span className="text-xs text-gray-500">30-Day Returns</span>
                </div>
            </div>
        </div>
    );
}
