"use client";

import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useState } from "react";
import { useTenant } from "@/lib/tenant-context";

export function ProductDetails({ product }: { product: Product }) {
    const { slug } = useTenant();
    const { addItem } = useCartStore(slug);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(
        product.variants[0]?.id
    );

    const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];

    const handleAddToCart = () => {
        if (!selectedVariant) return;

        addItem({
            id: selectedVariant.id,
            productId: product.id,
            name: product.name,
            price: selectedVariant.price,
            quantity: 1,
            slug: product.slug,
            image: product.featuredAsset?.preview
        });

        // Optional: Toast notification
        alert("Added to cart!");
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
                <div className="aspect-square relative bg-white rounded-lg overflow-hidden border">
                    {product.featuredAsset ? (
                        <img
                            src={product.featuredAsset.preview}
                            alt={product.name}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                    <p className="text-2xl font-semibold mt-2 text-primary">
                        {(selectedVariant?.price / 100).toLocaleString()} {selectedVariant?.currencyCode}
                    </p>
                </div>

                <div className="prose prose-sm text-gray-500">
                    <p>{product.description}</p>
                </div>

                {/* Variants Selection (if multiple) */}
                {product.variants.length > 1 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Variants</label>
                        <div className="flex gap-2 flex-wrap">
                            {product.variants.map((variant) => (
                                <Button
                                    key={variant.id}
                                    variant={selectedVariantId === variant.id ? "default" : "outline"}
                                    onClick={() => setSelectedVariantId(variant.id)}
                                >
                                    {variant.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    <Button size="lg" className="w-full md:w-auto" onClick={handleAddToCart}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
