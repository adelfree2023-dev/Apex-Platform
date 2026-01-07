"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";

interface SearchResult {
    productId: string;
    productName: string;
    slug: string;
    productAsset?: {
        preview: string;
    };
    price?: {
        value?: number;
        min?: number;
        max?: number;
    };
    currencyCode?: string;
}

interface SearchResultsProps {
    results: SearchResult[];
    query: string;
    tenantSlug: string;
}

export function SearchResults({ results, query, tenantSlug }: SearchResultsProps) {
    // No query entered
    if (!query) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    What are you looking for?
                </h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Use the search bar above to find products
                </p>
            </div>
        );
    }

    // No results
    if (results.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    No results found
                </h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    We couldn&apos;t find any products matching &quot;{query}&quot;.
                    Try a different search term.
                </p>
                <Button variant="outline" asChild>
                    <Link href={`/${tenantSlug}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        );
    }

    // Results grid
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((product) => (
                <Link
                    key={product.productId}
                    href={`/${tenantSlug}/products/${product.slug}`}
                    className="group"
                >
                    <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square mb-4 relative">
                        {product.productAsset ? (
                            <Image
                                src={product.productAsset.preview}
                                alt={product.productName}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                        {product.productName}
                    </h3>
                    {product.price && (product.price.value || product.price.min) && (
                        <p className="text-lg font-semibold text-primary mt-1">
                            ${((product.price.value || product.price.min || 0) / 100).toFixed(2)}
                        </p>
                    )}
                </Link>
            ))}
        </div>
    );
}
