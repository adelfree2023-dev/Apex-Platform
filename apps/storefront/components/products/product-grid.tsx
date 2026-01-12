"use client";

import {
    Star,
    MoreVertical,
    ShoppingCart,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Define the shape of our Product (simplified for the component)
export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currencyCode: string;
    featuredAsset?: { preview: string };
}

interface ProductGridProps {
    products: Product[];
    viewMode?: "grid" | "list";
}

export function ProductGrid({ products, viewMode = "grid" }: ProductGridProps) {

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Package className="size-7 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">No products found</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Try adjusting your search or check back later.
                </p>
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all cursor-pointer group flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    {/* Thumbnail / Icon Area */}
                                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        {/* In Phase 7: Use <Image> */}
                                        <Package className="size-5" />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "size-7 transition-opacity opacity-0 group-hover:opacity-100"
                                                    )}
                                                >
                                                    <Star className="size-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Add to wishlist
                                            </TooltipContent>
                                        </Tooltip>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Add to Cart</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-muted-foreground">
                                                    Share
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <h3 className="font-medium text-sm truncate mb-0.5" title={product.name}>
                                    {product.name}
                                </h3>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm font-semibold text-foreground">
                                    {(product.price / 100).toLocaleString('en-US', { style: 'currency', currency: product.currencyCode })}
                                </p>
                                <Button size="icon" variant="secondary" className="size-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ShoppingCart className="size-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}
