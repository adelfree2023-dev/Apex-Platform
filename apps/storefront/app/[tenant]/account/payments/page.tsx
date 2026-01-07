"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PaymentsPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const [tenantSlug, setTenantSlug] = useState("");

    useEffect(() => {
        params.then(p => setTenantSlug(p.tenant));
    }, [params]);

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6">
                <Button variant="ghost" asChild>
                    <Link href={`/${tenantSlug}/account`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment Methods</h1>

            <div className="text-center py-16 bg-white rounded-2xl border">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No payment methods saved</h2>
                <p className="text-gray-500 mb-4">Payment methods will be saved during checkout</p>
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Payment methods are securely processed by Stripe</span>
                </div>
            </div>
        </div>
    );
}
