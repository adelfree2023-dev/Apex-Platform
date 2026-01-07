"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Plus, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

interface Address {
    id: string;
    fullName?: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province?: string;
    postalCode?: string;
    country: { code: string; name: string };
    phoneNumber?: string;
    defaultShippingAddress?: boolean;
}

export default function AddressesPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const router = useRouter();
    const [tenantSlug, setTenantSlug] = useState("");
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        streetLine1: "",
        streetLine2: "",
        city: "",
        province: "",
        postalCode: "",
        countryCode: "US",
        phoneNumber: "",
    });

    useEffect(() => {
        params.then(p => setTenantSlug(p.tenant));
    }, [params]);

    useEffect(() => {
        if (!tenantSlug) return;
        fetchAddresses();
    }, [tenantSlug]);

    const fetchAddresses = async () => {
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
                        query GetAddresses {
                            activeCustomer {
                                addresses {
                                    id
                                    fullName
                                    streetLine1
                                    streetLine2
                                    city
                                    province
                                    postalCode
                                    country { code name }
                                    phoneNumber
                                    defaultShippingAddress
                                }
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            setAddresses(result.data?.activeCustomer?.addresses || []);
        } catch (err) {
            console.error("Failed to fetch addresses:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await fetch(VENDURE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "vendure-token": tenantSlug,
                },
                credentials: "include",
                body: JSON.stringify({
                    query: `
                        mutation CreateAddress($input: CreateAddressInput!) {
                            createCustomerAddress(input: $input) {
                                id
                            }
                        }
                    `,
                    variables: {
                        input: formData,
                    },
                }),
            });

            setShowForm(false);
            setFormData({ fullName: "", streetLine1: "", streetLine2: "", city: "", province: "", postalCode: "", countryCode: "US", phoneNumber: "" });
            fetchAddresses();
        } catch (err) {
            console.error("Failed to create address:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            await fetch(VENDURE_API, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "vendure-token": tenantSlug,
                },
                credentials: "include",
                body: JSON.stringify({
                    query: `
                        mutation DeleteAddress($id: ID!) {
                            deleteCustomerAddress(id: $id) { success }
                        }
                    `,
                    variables: { id },
                }),
            });
            fetchAddresses();
        } catch (err) {
            console.error("Failed to delete address:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Address
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 mb-6 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input value={formData.phoneNumber} onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Street Address</Label>
                        <Input value={formData.streetLine1} onChange={(e) => setFormData(prev => ({ ...prev, streetLine1: e.target.value }))} required />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Province/State</Label>
                            <Input value={formData.province} onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Postal Code</Label>
                            <Input value={formData.postalCode} onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Address
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                    </div>
                </form>
            )}

            {addresses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No addresses saved</h2>
                    <p className="text-gray-500">Add an address for faster checkout</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {addresses.map((address) => (
                        <div key={address.id} className="bg-white rounded-xl border p-6 flex justify-between items-start">
                            <div>
                                {address.fullName && <p className="font-semibold">{address.fullName}</p>}
                                <p className="text-gray-600">{address.streetLine1}</p>
                                {address.streetLine2 && <p className="text-gray-600">{address.streetLine2}</p>}
                                <p className="text-gray-600">{address.city}, {address.province} {address.postalCode}</p>
                                <p className="text-gray-600">{address.country.name}</p>
                                {address.phoneNumber && <p className="text-gray-500 text-sm mt-1">{address.phoneNumber}</p>}
                                {address.defaultShippingAddress && (
                                    <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(address.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
