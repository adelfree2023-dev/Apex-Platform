"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

interface CustomerData {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string;
}

export default function ProfilePage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const router = useRouter();
    const [tenantSlug, setTenantSlug] = useState("");
    const [customer, setCustomer] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
    });

    useEffect(() => {
        params.then(p => setTenantSlug(p.tenant));
    }, [params]);

    useEffect(() => {
        if (!tenantSlug) return;

        const fetchCustomer = async () => {
            try {
                const response = await fetch(VENDURE_API, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "vendure-token": tenantSlug,
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        query: `
                            query ActiveCustomer {
                                activeCustomer {
                                    id
                                    firstName
                                    lastName
                                    emailAddress
                                    phoneNumber
                                }
                            }
                        `,
                    }),
                });

                const result = await response.json();
                const activeCustomer = result.data?.activeCustomer;

                if (activeCustomer) {
                    setCustomer(activeCustomer);
                    setFormData({
                        firstName: activeCustomer.firstName || "",
                        lastName: activeCustomer.lastName || "",
                        phoneNumber: activeCustomer.phoneNumber || "",
                    });
                } else {
                    router.push(`/${tenantSlug}/auth/login`);
                }
            } catch (err) {
                console.error("Failed to fetch customer:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [tenantSlug, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(VENDURE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "vendure-token": tenantSlug,
                },
                credentials: "include",
                body: JSON.stringify({
                    query: `
                        mutation UpdateCustomer($input: UpdateCustomerInput!) {
                            updateCustomer(input: $input) {
                                id
                                firstName
                                lastName
                                phoneNumber
                            }
                        }
                    `,
                    variables: {
                        input: {
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            phoneNumber: formData.phoneNumber,
                        },
                    },
                }),
            });

            const result = await response.json();
            if (result.data?.updateCustomer) {
                setMessage("Profile updated successfully!");
            } else {
                setMessage("Failed to update profile");
            }
        } catch (err) {
            setMessage("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="mb-6">
                <Button variant="ghost" asChild>
                    <Link href={`/${tenantSlug}/account`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Account
                    </Link>
                </Button>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border p-6">
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes("success") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                        {message}
                    </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={customer.emailAddress}
                        disabled
                        className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+1 234 567 8900"
                    />
                </div>

                <Button type="submit" disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
