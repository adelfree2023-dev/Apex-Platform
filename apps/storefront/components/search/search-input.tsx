"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface SearchInputProps {
    tenantSlug: string;
    channelToken?: string;
    className?: string;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    featuredAsset?: { preview: string };
    priceWithTax?: { min: number };
    variants?: Array<{ priceWithTax: number }>;
}

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "https://shop-api.kitvet.com/shop-api";

export function SearchInput({ tenantSlug, channelToken, className }: SearchInputProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [popularProducts, setPopularProducts] = useState<Product[]>([]);

    // Fetch popular products on mount
    useEffect(() => {
        const fetchPopular = async () => {
            try {
                const res = await fetch(VENDURE_API, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(channelToken && { "vendure-token": channelToken }),
                    },
                    body: JSON.stringify({
                        query: `{
                            search(input: { take: 6 }) {
                                items {
                                    productId
                                    productName
                                    slug
                                    productAsset { preview }
                                    priceWithTax { ... on PriceRange { min } }
                                }
                            }
                        }`
                    })
                });
                const data = await res.json();
                const products = data?.data?.search?.items?.map((item: any) => ({
                    id: item.productId,
                    name: item.productName,
                    slug: item.slug,
                    featuredAsset: item.productAsset,
                    priceWithTax: item.priceWithTax
                })) || [];
                setPopularProducts(products);
            } catch (error) {
                console.error("Failed to fetch popular products:", error);
            }
        };
        fetchPopular();
    }, [channelToken]);

    // Live search
    const searchProducts = useCallback(async (searchTerm: string) => {
        if (searchTerm.length < 1) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(VENDURE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(channelToken && { "vendure-token": channelToken }),
                },
                body: JSON.stringify({
                    query: `query Search($term: String!) {
                        search(input: { term: $term, take: 8 }) {
                            items {
                                productId
                                productName
                                slug
                                productAsset { preview }
                                priceWithTax { ... on PriceRange { min } }
                            }
                        }
                    }`,
                    variables: { term: searchTerm }
                })
            });
            const data = await res.json();
            const products = data?.data?.search?.items?.map((item: any) => ({
                id: item.productId,
                name: item.productName,
                slug: item.slug,
                featuredAsset: item.productAsset,
                priceWithTax: item.priceWithTax
            })) || [];
            setSuggestions(products);
        } catch (error) {
            console.error("Search failed:", error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, [channelToken]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchProducts(query);
        }, 200);

        return () => clearTimeout(timer);
    }, [query, searchProducts]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setIsFocused(false);
            router.push(`/${tenantSlug}/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    const handleClear = () => {
        setQuery("");
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price / 100);
    };

    const displayProducts = query.length > 0 ? suggestions : popularProducts;
    const showNoResults = query.length > 0 && suggestions.length === 0 && !isSearching;

    return (
        <div ref={dropdownRef} className={cn("relative", className)}>
            <form onSubmit={handleSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Input
                    ref={inputRef}
                    type="search"
                    placeholder="Search products..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className="pl-10 pr-10"
                />
                {query && !isSearching && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin z-10" />
                )}
            </form>

            {/* Dropdown */}
            {isFocused && (displayProducts.length > 0 || showNoResults) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {/* Header */}
                    <div className="px-3 py-2 border-b bg-gray-50">
                        <span className="text-xs font-medium text-gray-500">
                            {query.length > 0
                                ? (suggestions.length > 0 ? `Found ${suggestions.length} results` : "No exact matches")
                                : "Popular Products"}
                        </span>
                    </div>

                    {/* No results message */}
                    {showNoResults && (
                        <div className="px-3 py-3 text-center border-b">
                            <p className="text-sm text-gray-500">
                                No products found for "{query}"
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Check out these suggestions instead:
                            </p>
                        </div>
                    )}

                    {/* Products list */}
                    <div className="divide-y">
                        {(showNoResults ? popularProducts : displayProducts).map((product) => (
                            <Link
                                key={product.id}
                                href={`/${tenantSlug}/product/${product.slug}`}
                                onClick={() => setIsFocused(false)}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-10 h-10 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {product.featuredAsset?.preview ? (
                                        <Image
                                            src={product.featuredAsset.preview}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Search className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {product.name}
                                    </p>
                                    {product.priceWithTax?.min && (
                                        <p className="text-xs text-primary font-semibold">
                                            {formatPrice(product.priceWithTax.min)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* View all link */}
                    {query.length > 0 && suggestions.length > 0 && (
                        <Link
                            href={`/${tenantSlug}/search?q=${encodeURIComponent(query)}`}
                            onClick={() => setIsFocused(false)}
                            className="block px-3 py-2 text-center text-sm text-primary hover:bg-gray-50 border-t"
                        >
                            View all results for "{query}"
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
