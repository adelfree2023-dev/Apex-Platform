"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { QuickCheckoutForm } from "./quick-checkout-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
    setOrderShippingAddress,
    setOrderBillingAddress,
    setOrderShippingMethod,
    transitionOrderToState,
    getEligibleShippingMethods,
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

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [customerEmail, setCustomerEmail] = useState<string>("");

    // Empty cart redirect
    if (items.length === 0 && !orderComplete) {
        return (
            <div className="text-center py-16" dir="rtl">
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
                        <ArrowLeft className="ml-2 h-5 w-5" />
                        متابعة التسوق
                    </Link>
                </Button>
            </div>
        );
    }

    // Order complete view
    if (orderComplete) {
        return (
            <div className="text-center py-16" dir="rtl">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    تم الطلب بنجاح! 🎉
                </h2>
                <p className="text-gray-500 mb-2">
                    شكراً لك على طلبك
                </p>
                <div className="bg-primary/10 rounded-xl p-4 inline-block mb-6">
                    <p className="text-sm text-gray-600 mb-1">رقم الطلب:</p>
                    <p className="text-2xl font-bold text-primary">{orderId}</p>
                </div>
                <p className="text-sm text-gray-500 mb-8">
                    تم إرسال تأكيد إلى {customerEmail}
                </p>
                <div className="space-y-3">
                    <Button asChild size="lg" className="w-full max-w-xs">
                        <Link href={`/${tenantSlug}`}>
                            متابعة التسوق
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="w-full max-w-xs">
                        <Link href={`/${tenantSlug}/account/orders`}>
                            تتبع طلباتي
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const handleQuickCheckout = async (shippingData: ShippingData, paymentData: PaymentData) => {
        setError(null);
        setIsProcessing(true);
        setCustomerEmail(shippingData.email);

        try {
            // 1. Set shipping address
            const addressResult = await setOrderShippingAddress(channelToken, {
                fullName: shippingData.fullName,
                streetLine1: shippingData.address,
                city: shippingData.city,
                postalCode: shippingData.postalCode,
                countryCode: "EG",
                phoneNumber: shippingData.phone,
            });

            if (!addressResult.success) {
                throw new Error(addressResult.message || "فشل في تعيين العنوان");
            }

            // 2. Set billing address (same as shipping)
            await setOrderBillingAddress(channelToken, {
                fullName: shippingData.fullName,
                streetLine1: shippingData.address,
                city: shippingData.city,
                postalCode: shippingData.postalCode,
                countryCode: "EG",
                phoneNumber: shippingData.phone,
            });

            // 3. Set shipping method
            const shippingMethods = await getEligibleShippingMethods(channelToken);
            if (shippingMethods.length > 0) {
                await setOrderShippingMethod(channelToken, shippingMethods[0].id);
            }

            // 4. Transition to ArrangingPayment
            const transitionResult = await transitionOrderToState(channelToken, "ArrangingPayment");

            if (!transitionResult.success) {
                throw new Error(transitionResult.message || "فشل في تحضير الطلب");
            }

            // 5. Add payment
            const paymentMethod = paymentData.method === "cod" ? "manual" : "stripe";
            const paymentResult = await addPaymentToOrder(channelToken, paymentMethod);

            if (!paymentResult?.code) {
                throw new Error("فشل في إتمام الدفع");
            }

            // 6. Success!
            setOrderId(paymentResult.code);
            setOrderComplete(true);

            // 7. Refresh cart
            await refreshCart();

        } catch (err) {
            setError(err instanceof Error ? err.message : "حدث خطأ أثناء إتمام الطلب");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full">
            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3" dir="rtl">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-800 font-medium">حدث خطأ</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Quick Checkout Form - Single Step! */}
            <QuickCheckoutForm
                onSubmit={handleQuickCheckout}
                isProcessing={isProcessing}
                tenantSlug={tenantSlug}
                channelToken={channelToken}
                cartTotal={totalPrice}
            />
        </div>
    );
}
