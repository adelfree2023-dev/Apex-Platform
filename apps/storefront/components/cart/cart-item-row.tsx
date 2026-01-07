"use client";

import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, Loader2 } from "lucide-react";

interface CartItemRowProps {
    item: {
        id: string;
        lineId: string;
        productId: string;
        name: string;
        slug: string;
        price: number;
        currencyCode?: string;
        quantity: number;
        image?: string;
    };
    tenantSlug: string;
}

export function CartItemRow({ item, tenantSlug }: CartItemRowProps) {
    const { updateQuantity, removeItem, isLoading } = useCartStore(tenantSlug);
    const lineTotal = item.price * item.quantity;

    return (
        <div className="grid grid-cols-12 gap-4 items-center py-4 border-b border-gray-100">
            {/* Product Image & Info */}
            <div className="col-span-6 flex gap-4 items-center">
                <Link href={`/${tenantSlug}/products/${item.slug}`}>
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border flex-shrink-0">
                        {item.image ? (
                            <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                No Image
                            </div>
                        )}
                    </div>
                </Link>
                <div>
                    <Link href={`/${tenantSlug}/products/${item.slug}`}>
                        <h3 className="font-medium text-gray-900 hover:text-primary line-clamp-2">
                            {item.name}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-500">
                        {item.currencyCode || 'USD'}
                    </p>
                </div>
            </div>

            {/* Unit Price */}
            <div className="col-span-2 text-center">
                <span className="font-medium">
                    {(item.price / 100).toFixed(2)}
                </span>
            </div>

            {/* Quantity Controls */}
            <div className="col-span-2 flex justify-center">
                <div className="flex items-center gap-2 border rounded-lg p-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isLoading}
                        onClick={() => {
                            if (item.quantity === 1) {
                                removeItem(item.lineId);
                            } else {
                                updateQuantity(item.lineId, item.quantity - 1);
                            }
                        }}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.quantity}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isLoading}
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Line Total & Delete */}
            <div className="col-span-2 flex items-center justify-end gap-2">
                <span className="font-bold text-gray-900">
                    {(lineTotal / 100).toFixed(2)} {item.currencyCode || 'USD'}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                    disabled={isLoading}
                    onClick={() => removeItem(item.lineId)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
