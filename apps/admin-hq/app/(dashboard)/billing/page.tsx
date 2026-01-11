"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createCheckoutSession } from "@/lib/api-client";
import { Loader2, Check } from "lucide-react";

const PLANS = [
    {
        id: "price_basic", // TODO: Replace with real Stripe Price ID
        name: "Basic Plan",
        price: "EGP 499",
        description: "Perfect for starters",
        features: ["Up to 100 Products", "Basic Analytics", "Standard Support"]
    },
    {
        id: "price_pro", // TODO: Replace with real Stripe Price ID
        name: "Pro Plan",
        price: "EGP 999",
        description: "For growing businesses",
        features: ["Unlimited Products", "Advanced Analytics", "Priority Support", "Custom Domain"]
    }
];

export default function BillingPage() {
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

    const handleSubscribe = async (priceId: string) => {
        try {
            setLoadingPriceId(priceId);
            const { url } = await createCheckoutSession(priceId);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Failed to start checkout:", error);
            alert("Failed to start checkout. Please try again.");
        } finally {
            setLoadingPriceId(null);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Upgrade your Plan</h1>
                <p className="text-gray-500">Choose the perfect plan for your business growth.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {PLANS.map((plan) => (
                    <Card key={plan.id} className="flex flex-col relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-gray-500">/month</span>
                            </div>
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={loadingPriceId !== null}
                            >
                                {loadingPriceId === plan.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Redirecting...
                                    </>
                                ) : (
                                    "Subscribe Now"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="mt-12 text-center text-sm text-gray-400">
                <p>Secure payments processed by Stripe.</p>
            </div>
        </div>
    );
}
