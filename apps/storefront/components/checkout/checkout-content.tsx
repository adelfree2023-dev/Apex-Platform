"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { CheckoutSteps } from "./checkout-steps";
import { ShippingForm } from "./shipping-form";
import { PaymentForm } from "./payment-form";
import { OrderReview } from "./order-review";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface CheckoutContentProps {
    tenantSlug: string;
    channelToken: string;
}

export interface ShippingData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface PaymentData {
    method: "card" | "cod";
    cardNumber?: string;
    cardExpiry?: string;
    cardCvc?: string;
}

export function CheckoutContent({ tenantSlug, channelToken }: CheckoutContentProps) {
    const { items, totalItems, totalPrice, clearCart, isLoading } = useCartStore(tenantSlug);

    const [step, setStep] = useState(1);
    const [shippingData, setShippingData] = useState<ShippingData | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Empty cart redirect
    if (items.length === 0 && !orderComplete) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Your cart is empty
                </h2>
                <p className="text-gray-500 mb-8">
                    Add some items to your cart before checking out.
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

    // Order complete view
    if (orderComplete) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Order Placed Successfully!
                </h2>
                <p className="text-gray-500 mb-2">
                    Thank you for your order.
                </p>
                <p className="text-lg font-semibold text-primary mb-8">
                    Order ID: {orderId}
                </p>
                <p className="text-sm text-gray-500 mb-8">
                    A confirmation email has been sent to {shippingData?.email}
                </p>
                <Button asChild size="lg">
                    <Link href={`/${tenantSlug}`}>
                        Continue Shopping
                    </Link>
                </Button>
            </div>
        );
    }

    const handleShippingSubmit = (data: ShippingData, saveAddress: boolean) => {
        setShippingData(data);
        // TODO: If saveAddress is true, call createCustomerAddress
        setStep(2);
    };

    const handlePaymentSubmit = (data: PaymentData) => {
        setPaymentData(data);
        setStep(3);
    };

    const handlePlaceOrder = async () => {
        setIsProcessing(true);

        // Simulate order processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate order ID
        const newOrderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
        setOrderId(newOrderId);

        // Clear cart and show success
        clearCart();
        setOrderComplete(true);
        setIsProcessing(false);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Steps Indicator */}
            <CheckoutSteps currentStep={step} />

            <div className="mt-8">
                {/* Step 1: Shipping */}
                {step === 1 && (
                    <ShippingForm
                        initialData={shippingData}
                        onSubmit={handleShippingSubmit}
                        tenantSlug={tenantSlug}
                        channelToken={channelToken}
                    />
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                    <PaymentForm
                        initialData={paymentData}
                        onSubmit={handlePaymentSubmit}
                        onBack={handleBack}
                    />
                )}

                {/* Step 3: Review */}
                {step === 3 && shippingData && paymentData && (
                    <OrderReview
                        items={items}
                        shippingData={shippingData}
                        paymentData={paymentData}
                        subtotal={totalPrice}
                        onPlaceOrder={handlePlaceOrder}
                        onBack={handleBack}
                        isProcessing={isProcessing}
                    />
                )}
            </div>
        </div>
    );
}
