"use client";

import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";

interface CartItem {
    id: string;
    productId: string;
    name: string;
    slug: string;
    price: number;
    currencyCode?: string;
    quantity: number;
    image?: string;
}

interface CartItemRowProps {
    item: CartItem;
    tenantSlug: string;
}

export function CartItemRow({ item, tenantSlug }: CartItemRowProps) {
    const { updateQuantity, removeItem } = useCartStore(tenantSlug);
    const lineTotal = item.price * item.quantity;

    return (
        <div className="grid grid-cols-12 gap-4 items-center py-4 border-b border-gray-100">
            {/* Product Info */}
            <div className="col-span-12 md:col-span-6 flex gap-4">
                {/* Image */}
                <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
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

                {/* Name & Link */}
                <div className="flex flex-col justify-center">
                    <Link
                        href={`/${tenantSlug}/products/${item.slug}`}
                        className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2"
                    >
                        {item.name}
                    </Link>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                        <Trash2 className="h-3 w-3" />
                        Remove
                    </button>
                </div>
            </div>

            {/* Price */}
            <div className="col-span-4 md:col-span-2 text-center">
                <span className="text-gray-600">
                    {(item.price / 100).toFixed(2)} {item.currencyCode}
                </span>
            </div>

            {/* Quantity Controls */}
            <div className="col-span-4 md:col-span-2 flex justify-center">
                <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Line Total */}
            <div className="col-span-4 md:col-span-2 text-right">
                <span className="font-semibold text-gray-900">
                    {(lineTotal / 100).toFixed(2)} {item.currencyCode}
                </span>
            </div>
        </div>
    );
}
