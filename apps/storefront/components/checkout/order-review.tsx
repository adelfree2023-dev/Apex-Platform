"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, MapPin, CreditCard, Banknote } from "lucide-react";
import Image from "next/image";
import type { ShippingData, PaymentData } from "./checkout-content";

interface CartItem {
    variantId: string;
    productId: string;
    name: string;
    slug: string;
    price: number;
    currencyCode: string;
    quantity: number;
    image?: string;
}

interface OrderReviewProps {
    items: CartItem[];
    shippingData: ShippingData;
    paymentData: PaymentData;
    subtotal: number;
    onPlaceOrder: () => void;
    onBack: () => void;
    isProcessing: boolean;
}

export function OrderReview({
    items,
    shippingData,
    paymentData,
    subtotal,
    onPlaceOrder,
    onBack,
    isProcessing,
}: OrderReviewProps) {
    const shipping = subtotal > 5000 ? 0 : 999;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shipping + tax;

    return (
        <div className="space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-2xl border p-6">
                <h2 className="text-xl font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.variantId} className="flex gap-4 items-center">
                            <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.image ? (
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">
                                ${((item.price * item.quantity) / 100).toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shipping & Payment Summary */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Shipping */}
                <div className="bg-white rounded-2xl border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Shipping Address</h3>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">{shippingData.fullName}</p>
                        <p>{shippingData.address}</p>
                        <p>{shippingData.city}, {shippingData.postalCode}</p>
                        <p>{shippingData.country}</p>
                        <p className="pt-2">{shippingData.phone}</p>
                        <p>{shippingData.email}</p>
                    </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-2xl border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        {paymentData.method === "card" ? (
                            <CreditCard className="h-5 w-5 text-primary" />
                        ) : (
                            <Banknote className="h-5 w-5 text-primary" />
                        )}
                        <h3 className="font-semibold">Payment Method</h3>
                    </div>
                    <div className="text-sm text-gray-600">
                        {paymentData.method === "card" ? (
                            <div>
                                <p className="font-medium text-gray-900">Credit Card</p>
                                <p>**** **** **** {paymentData.cardNumber?.slice(-4)}</p>
                                <p>Expires: {paymentData.cardExpiry}</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-gray-900">Cash on Delivery</p>
                                <p>Pay when you receive your order</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Total */}
            <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold mb-4">Order Total</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className={shipping === 0 ? "text-green-600" : ""}>
                            {shipping === 0 ? "FREE" : `$${(shipping / 100).toFixed(2)}`}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax</span>
                        <span>${(tax / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>${(total / 100).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={onBack} disabled={isProcessing}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Payment
                </Button>
                <Button onClick={onPlaceOrder} disabled={isProcessing} size="lg">
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        `Place Order - $${(total / 100).toFixed(2)}`
                    )}
                </Button>
            </div>
        </div>
    );
}
