"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Banknote, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentData } from "./checkout-content";

type PaymentMethod = PaymentData["method"];

const PAYMENT_OPTIONS: { id: PaymentMethod; name: string; icon: string; desc: string }[] = [
    { id: "cod", name: "الدفع عند الاستلام", icon: "💵", desc: "ادفع للمندوب عند التوصيل" },
    { id: "instapay", name: "InstaPay", icon: "📱", desc: "تحويل فوري من أي بنك" },
    { id: "vodafone-cash", name: "فودافون كاش", icon: "📲", desc: "محفظة فودافون" },
    { id: "etisalat-cash", name: "اتصالات كاش", icon: "📲", desc: "محفظة اتصالات" },
    { id: "orange-cash", name: "أورنج كاش", icon: "📲", desc: "محفظة أورنج" },
    { id: "fawry", name: "فوري", icon: "🏪", desc: "ادفع في أي فرع فوري" },
];

interface PaymentFormProps {
    initialData: PaymentData | null;
    onSubmit: (data: PaymentData) => void;
    onBack: () => void;
}

export function PaymentForm({ initialData, onSubmit, onBack }: PaymentFormProps) {
    const [method, setMethod] = useState<PaymentMethod>(initialData?.method || "cod");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ method });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
            <div className="bg-white rounded-2xl border p-6 space-y-6">
                <h2 className="text-xl font-semibold">اختر طريقة الدفع</h2>

                <div className="grid gap-3">
                    {PAYMENT_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setMethod(option.id)}
                            className={cn(
                                "p-4 rounded-xl border-2 flex items-center gap-3 transition-all text-right",
                                method === option.id
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <span className="text-2xl">{option.icon}</span>
                            <div className="flex-1">
                                <p className="font-medium">{option.name}</p>
                                <p className="text-sm text-gray-500">{option.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Payment Instructions */}
                {method === "cod" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            💵 ستدفع للمندوب عند استلام الطلب
                        </p>
                    </div>
                )}
                {(method === "instapay" || method.includes("cash")) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            📱 سيتم إرسال تفاصيل التحويل بعد تأكيد الطلب
                        </p>
                    </div>
                )}
                {method === "fawry" && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            🏪 سيتم إرسال كود الدفع لتدفع في أي فرع فوري خلال 48 ساعة
                        </p>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <Button type="button" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    العودة
                </Button>
                <Button type="submit">
                    متابعة
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}
