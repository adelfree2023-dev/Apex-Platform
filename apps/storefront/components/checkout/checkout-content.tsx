"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { CheckoutSteps } from "./checkout-steps";
import { ShippingForm } from "./shipping-form";
import { PaymentForm } from "./payment-form";
import { OrderReview } from "./order-review";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
    setOrderShippingAddress,
    setOrderBillingAddress,
    setOrderShippingMethod,
    transitionOrderToState,
    getEligibleShippingMethods,
    createCustomerAddress,
} from "@/lib/vendure-checkout";

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

// Add payment mutation
const ADD_PAYMENT_MUTATION = `
    mutation AddPaymentToOrder($input: PaymentInput!) {
        addPaymentToOrder(input: $input) {
            ... on Order {
                id
                code
                state
            }
            ... on PaymentFailedError {
                errorCode
                message
            }
            ... on PaymentDeclinedError {
                errorCode
                message
            }
            ... on OrderStateTransitionError {
                errorCode
                message
            }
            ... on NoActiveOrderError {
                errorCode
                message
            }
        }
    }
`;

async function addPaymentToOrder(channelToken: string, method: string) {
    const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

    const response = await fetch(VENDURE_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "vendure-token": channelToken,
        },
        credentials: "include",
        body: JSON.stringify({
            query: ADD_PAYMENT_MUTATION,
            variables: {
                input: {
                    method: method,
                    metadata: {}
                }
            }
        }),
    });

    const result = await response.json();

    if (result.errors) {
        throw new Error(result.errors[0]?.message || "Payment failed");
    }

    const paymentResult = result.data?.addPaymentToOrder;
    if (paymentResult?.errorCode) {
        throw new Error(paymentResult.message || "Payment failed");
    }

    return paymentResult;
}

export function CheckoutContent({ tenantSlug, channelToken }: CheckoutContentProps) {
    const { items, totalItems, totalPrice, refreshCart, isLoading } = useCartStore(tenantSlug);

    const [step, setStep] = useState(1);
    const [shippingData, setShippingData] = useState<ShippingData | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Empty cart redirect
    if (items.length === 0 && !orderComplete) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                    <ShoppingBag className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    سلة التسوق فارغة
                </h2>
                <p className="text-gray-500 mb-8">
                    أضف بعض المنتجات قبل إتمام الشراء
                </p>
                <Button asChild size="lg">
                    <Link href={`/${tenantSlug}`}>
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        متابعة التسوق
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
                    تم الطلب بنجاح! 🎉
                </h2>
                <p className="text-gray-500 mb-2">
                    شكراً لك على طلبك
                </p>
                <p className="text-lg font-semibold text-primary mb-8">
                    رقم الطلب: {orderId}
                </p>
                <p className="text-sm text-gray-500 mb-8">
                    تم إرسال تأكيد إلى {shippingData?.email}
                </p>
                <Button asChild size="lg">
                    <Link href={`/${tenantSlug}`}>
                        متابعة التسوق
                    </Link>
                </Button>
            </div>
        );
    }

    const handleShippingSubmit = async (data: ShippingData, saveAddress: boolean) => {
        setError(null);
        setIsProcessing(true);

        try {
            // 1. Set shipping address on order
            const addressResult = await setOrderShippingAddress(channelToken, {
                fullName: data.fullName,
                streetLine1: data.address,
                city: data.city,
                postalCode: data.postalCode,
                countryCode: "EG", // Default to Egypt
                phoneNumber: data.phone,
            });

            if (!addressResult.success) {
                throw new Error(addressResult.message || "فشل في تعيين العنوان");
            }

            // 2. Set billing address (same as shipping)
            await setOrderBillingAddress(channelToken, {
                fullName: data.fullName,
                streetLine1: data.address,
                city: data.city,
                postalCode: data.postalCode,
                countryCode: "EG",
                phoneNumber: data.phone,
            });

            // 3. Get and set shipping method
            const shippingMethods = await getEligibleShippingMethods(channelToken);
            if (shippingMethods.length > 0) {
                await setOrderShippingMethod(channelToken, shippingMethods[0].id);
            }

            // 4. Optionally save address for customer
            if (saveAddress) {
                await createCustomerAddress(channelToken, {
                    fullName: data.fullName,
                    streetLine1: data.address,
                    city: data.city,
                    postalCode: data.postalCode,
                    countryCode: "EG",
                    phoneNumber: data.phone,
                    defaultShippingAddress: true,
                });
            }

            setShippingData(data);
            setStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentSubmit = (data: PaymentData) => {
        setPaymentData(data);
        setStep(3);
    };

    const handlePlaceOrder = async () => {
        setError(null);
        setIsProcessing(true);

        try {
            // 1. Transition to ArrangingPayment state
            const transitionResult = await transitionOrderToState(channelToken, "ArrangingPayment");

            if (!transitionResult.success) {
                throw new Error(transitionResult.message || "فشل في تحضير الطلب");
            }

            // 2. Add payment (COD or card)
            const paymentMethod = paymentData?.method === "cod"
                ? "manual" // Use manual payment method for COD
                : "stripe"; // For card payments

            const paymentResult = await addPaymentToOrder(channelToken, paymentMethod);

            if (!paymentResult?.code) {
                throw new Error("فشل في إتمام الدفع");
            }

            // 3. Success!
            setOrderId(paymentResult.code);
            setOrderComplete(true);

            // 4. Refresh cart (it should be empty now)
            await refreshCart();

        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ أثناء إتمام الطلب");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-800 font-medium">حدث خطأ</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            )}

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

