"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckoutStepsProps {
    currentStep: number;
}

const steps = [
    { number: 1, label: "Shipping" },
    { number: 2, label: "Payment" },
    { number: 3, label: "Review" },
];

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
    return (
        <div className="flex items-center justify-center">
            {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                    {/* Step Circle */}
                    <div
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors",
                            currentStep > step.number
                                ? "bg-primary border-primary text-white"
                                : currentStep === step.number
                                    ? "border-primary text-primary"
                                    : "border-gray-300 text-gray-300"
                        )}
                    >
                        {currentStep > step.number ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            step.number
                        )}
                    </div>

                    {/* Step Label */}
                    <span
                        className={cn(
                            "ml-2 text-sm font-medium hidden sm:inline",
                            currentStep >= step.number ? "text-gray-900" : "text-gray-400"
                        )}
                    >
                        {step.label}
                    </span>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <div
                            className={cn(
                                "w-12 sm:w-24 h-0.5 mx-4",
                                currentStep > step.number ? "bg-primary" : "bg-gray-200"
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
