"use client";

import { useCartStore } from "@/lib/cart-store";
import { CartItemRow } from "./cart-item-row";
import { CartSummary } from "./cart-summary";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface CartPageContentProps {
    tenantSlug: string;
}

export function CartPageContent({ tenantSlug }: CartPageContentProps) {
    const { items, isLoading, error, totalItems, totalPrice, clearCart } = useCartStore(tenantSlug);

    // Loading state
    if (isLoading && items.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Empty cart state
    if (items.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Your cart is empty
                </h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Looks like you haven&apos;t added anything to your cart yet.
                    Start shopping to fill it up!
                </p>
                <Button asChild size="lg">
                    <Link href={`/${tenantSlug}`}>
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Continue Shopping
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Header Row */}
                <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 pb-4 border-b">
                    <div className="col-span-6">Product</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items */}
                {items.map((item, index) => (
                    <CartItemRow
                        key={item.lineId || `${item.id}-${index}`}
                        item={item}
                        tenantSlug={tenantSlug}
                    />
                ))}

                {/* Clear Cart Button */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="ghost" asChild>
                        <Link href={`/${tenantSlug}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Continue Shopping
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={isLoading}
                        onClick={() => clearCart()}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Clear Cart
                    </Button>
                </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
                <CartSummary
                    totalItems={totalItems}
                    subtotal={totalPrice}
                    tenantSlug={tenantSlug}
                />
            </div>
        </div>
    );
}
