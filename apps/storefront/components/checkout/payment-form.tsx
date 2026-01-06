"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentData } from "./checkout-content";

interface PaymentFormProps {
    initialData: PaymentData | null;
    onSubmit: (data: PaymentData) => void;
    onBack: () => void;
}

export function PaymentForm({ initialData, onSubmit, onBack }: PaymentFormProps) {
    const [method, setMethod] = useState<"card" | "cod">(initialData?.method || "card");
    const [cardNumber, setCardNumber] = useState(initialData?.cardNumber || "");
    const [cardExpiry, setCardExpiry] = useState(initialData?.cardExpiry || "");
    const [cardCvc, setCardCvc] = useState(initialData?.cardCvc || "");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (method === "card") {
            if (!cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
                newErrors.cardNumber = "Enter valid 16-digit card number";
            }
            if (!cardExpiry.match(/^\d{2}\/\d{2}$/)) {
                newErrors.cardExpiry = "Enter valid expiry (MM/YY)";
            }
            if (!cardCvc.match(/^\d{3,4}$/)) {
                newErrors.cardCvc = "Enter valid CVC";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                method,
                cardNumber: method === "card" ? cardNumber : undefined,
                cardExpiry: method === "card" ? cardExpiry : undefined,
                cardCvc: method === "card" ? cardCvc : undefined,
            });
        }
    };

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 16);
        const parts = cleaned.match(/.{1,4}/g);
        return parts ? parts.join(" ") : cleaned;
    };

    const formatExpiry = (value: string) => {
        const cleaned = value.replace(/\D/g, "").slice(0, 4);
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
        }
        return cleaned;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border p-6 space-y-6">
                <h2 className="text-xl font-semibold">Payment Method</h2>

                {/* Method Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setMethod("card")}
                        className={cn(
                            "p-4 rounded-xl border-2 flex items-center gap-3 transition-all",
                            method === "card"
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                        )}
                    >
                        <CreditCard className={cn("h-6 w-6", method === "card" ? "text-primary" : "text-gray-400")} />
                        <div className="text-left">
                            <p className="font-medium">Credit Card</p>
                            <p className="text-sm text-gray-500">Visa, Mastercard, Amex</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMethod("cod")}
                        className={cn(
                            "p-4 rounded-xl border-2 flex items-center gap-3 transition-all",
                            method === "cod"
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                        )}
                    >
                        <Banknote className={cn("h-6 w-6", method === "cod" ? "text-primary" : "text-gray-400")} />
                        <div className="text-left">
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-gray-500">Pay when you receive</p>
                        </div>
                    </button>
                </div>

                {/* Card Details - Only show if card selected */}
                {method === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="cardNumber">Card Number *</Label>
                            <Input
                                id="cardNumber"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                placeholder="1234 5678 9012 3456"
                                className={errors.cardNumber ? "border-red-500" : ""}
                            />
                            {errors.cardNumber && <p className="text-sm text-red-500">{errors.cardNumber}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cardExpiry">Expiry Date *</Label>
                                <Input
                                    id="cardExpiry"
                                    value={cardExpiry}
                                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                    placeholder="MM/YY"
                                    className={errors.cardExpiry ? "border-red-500" : ""}
                                />
                                {errors.cardExpiry && <p className="text-sm text-red-500">{errors.cardExpiry}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardCvc">CVC *</Label>
                                <Input
                                    id="cardCvc"
                                    value={cardCvc}
                                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    placeholder="123"
                                    className={errors.cardCvc ? "border-red-500" : ""}
                                />
                                {errors.cardCvc && <p className="text-sm text-red-500">{errors.cardCvc}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* COD Notice */}
                {method === "cod" && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            💵 You will pay the delivery person when you receive your order.
                            Please have the exact amount ready.
                        </p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Shipping
                </Button>
                <Button type="submit">
                    Review Order
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}
