"use client";

import { useState } from "react";
import { ProductGallery } from "./product-gallery";
import { VariantSelector } from "./variant-selector";
import { ProductInfo } from "./product-info";
import { AddToCartBtn } from "./add-to-cart-btn";
import type { Product, ProductVariant, ProductAsset } from "@/lib/vendure-client";

interface ProductDetailClientProps {
    product: Product;
    tenantSlug: string;
}

export function ProductDetailClient({ product, tenantSlug }: ProductDetailClientProps) {
    // Initialize with first variant
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
        product.variants[0] || {
            id: product.id,
            price: 0,
            priceWithTax: 0,
            currencyCode: "USD"
        }
    );

    // Combine featured asset with other assets for gallery
    const allImages: ProductAsset[] = [];
    if (product.featuredAsset) {
        allImages.push(product.featuredAsset);
    }
    if (product.assets) {
        product.assets.forEach(asset => {
            // Avoid duplicates
            if (!allImages.some(img => img.preview === asset.preview)) {
                allImages.push(asset);
            }
        });
    }

    const handleVariantChange = (variant: ProductVariant) => {
        setSelectedVariant(variant);
    };

    const isInStock = selectedVariant.stockLevel !== "OUT_OF_STOCK";

    return (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            {/* Left: Image Gallery */}
            <ProductGallery images={allImages} productName={product.name} />

            {/* Right: Product Info & Actions */}
            <div className="space-y-6">
                <ProductInfo
                    name={product.name}
                    description={product.description}
                    price={selectedVariant.price}
                    currencyCode={selectedVariant.currencyCode}
                    inStock={isInStock}
                    sku={selectedVariant.sku}
                />

                {/* Variant Selector */}
                {product.variants.length > 1 && (
                    <VariantSelector
                        variants={product.variants}
                        selectedVariantId={selectedVariant.id}
                        onVariantChange={handleVariantChange}
                    />
                )}

                {/* Add to Cart */}
                <div className="pt-4">
                    <AddToCartBtn
                        tenantSlug={tenantSlug}
                        product={{
                            id: product.id,
                            variantId: selectedVariant.id,
                            name: product.name,
                            price: selectedVariant.price,
                            currencyCode: selectedVariant.currencyCode,
                            slug: product.slug,
                            image: product.featuredAsset?.preview
                        }}
                    />
                </div>

                {/* Additional Note */}
                <p className="text-xs text-gray-400 pt-4">
                    Free shipping on orders over $50. Secure checkout with SSL encryption.
                </p>
            </div>
        </div>
    );
}
