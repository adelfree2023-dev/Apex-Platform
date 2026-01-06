"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ShieldCheck, Truck, Tag } from "lucide-react";
import Link from "next/link";

interface CartSummaryProps {
    totalItems: number;
    subtotal: number;
    tenantSlug: string;
}

export function CartSummary({ totalItems, subtotal, tenantSlug }: CartSummaryProps) {
    const [promoCode, setPromoCode] = useState("");
    const [promoApplied, setPromoApplied] = useState(false);

    // Calculate estimates
    const shipping = subtotal > 5000 ? 0 : 999; // Free shipping over $50
    const tax = Math.round(subtotal * 0.1); // 10% tax estimate
    const discount = promoApplied ? Math.round(subtotal * 0.1) : 0; // 10% promo
    const total = subtotal + shipping + tax - discount;

    const handleApplyPromo = () => {
        if (promoCode.toLowerCase() === "apex10") {
            setPromoApplied(true);
        }
    };

    return (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-6 sticky top-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>

            {/* Promo Code */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Promo Code</label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={promoApplied}
                    />
                    <Button
                        variant="outline"
                        onClick={handleApplyPromo}
                        disabled={promoApplied || !promoCode}
                    >
                        Apply
                    </Button>
                </div>
                {promoApplied && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        10% discount applied!
                    </p>
                )}
            </div>

            {/* Summary Lines */}
            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                    <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>
                        {shipping === 0 ? "FREE" : `$${(shipping / 100).toFixed(2)}`}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Tax</span>
                    <span>${(tax / 100).toFixed(2)}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${(discount / 100).toFixed(2)}</span>
                    </div>
                )}

                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${(total / 100).toFixed(2)}</span>
                </div>
            </div>

            {/* Checkout Button */}
            <Button className="w-full" size="lg" asChild>
                <Link href={`/${tenantSlug}/checkout`}>
                    Proceed to Checkout
                </Link>
            </Button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                <div className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    Secure
                </div>
                <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    {shipping === 0 ? "Free Shipping" : "Fast Delivery"}
                </div>
            </div>
        </div>
    );
}
