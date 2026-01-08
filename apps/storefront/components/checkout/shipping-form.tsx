"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { ShippingData } from "./checkout-content";
import { AddressSelector } from "./address-selector";
import {
    getActiveCustomer,
    type ActiveCustomer,
    type CustomerAddress
} from "@/lib/vendure-checkout";

interface ShippingFormProps {
    initialData: ShippingData | null;
    onSubmit: (data: ShippingData, saveAddress: boolean) => void;
    tenantSlug: string;
    channelToken: string;
}

export function ShippingForm({
    initialData,
    onSubmit,
    tenantSlug,
    channelToken
}: ShippingFormProps) {
    const [customer, setCustomer] = useState<ActiveCustomer | null>(null);
    const [loading, setLoading] = useState(true);
    const [saveAddress, setSaveAddress] = useState(false);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);

    const [formData, setFormData] = useState<ShippingData>(
        initialData || {
            fullName: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            postalCode: "",
            country: "",
        }
    );

    const [errors, setErrors] = useState<Partial<ShippingData>>({});

    // Fetch customer data on mount
    useEffect(() => {
        async function fetchCustomer() {
            setLoading(true);
            try {
                const activeCustomer = await getActiveCustomer(channelToken);
                setCustomer(activeCustomer);

                // Pre-fill form with customer data if logged in
                if (activeCustomer && !initialData) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: `${activeCustomer.firstName} ${activeCustomer.lastName}`.trim(),
                        email: activeCustomer.emailAddress,
                        phone: activeCustomer.phoneNumber || prev.phone,
                    }));

                    // If customer has saved addresses, show selector
                    if (activeCustomer.addresses.length > 0) {
                        setShowNewAddressForm(false);
                    } else {
                        setShowNewAddressForm(true);
                    }
                } else {
                    setShowNewAddressForm(true);
                }
            } catch (error) {
                console.error("Failed to fetch customer:", error);
                setShowNewAddressForm(true);
            } finally {
                setLoading(false);
            }
        }

        fetchCustomer();
    }, [channelToken, initialData]);

    // Handle saved address selection
    const handleAddressSelect = (address: CustomerAddress | null) => {
        if (address) {
            setFormData(prev => ({
                ...prev,
                fullName: address.fullName,
                phone: address.phoneNumber || prev.phone,
                address: [address.streetLine1, address.streetLine2].filter(Boolean).join(", "),
                city: address.city,
                postalCode: address.postalCode,
                country: address.country.name,
            }));
            setShowNewAddressForm(false);
        } else {
            // User wants new address
            setShowNewAddressForm(true);
            setFormData(prev => ({
                ...prev,
                fullName: customer ? `${customer.firstName} ${customer.lastName}`.trim() : "",
                address: "",
                city: "",
                postalCode: "",
                country: "",
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error on change
        if (errors[name as keyof ShippingData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<ShippingData> = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required";
        if (!formData.country.trim()) newErrors.country = "Country is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData, saveAddress);
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border p-6 space-y-6">
                <h2 className="text-xl font-semibold">Shipping Information</h2>

                {/* Saved Addresses Selector (if logged in with addresses) */}
                {customer && customer.addresses.length > 0 && (
                    <AddressSelector
                        addresses={customer.addresses}
                        onSelect={handleAddressSelect}
                        placeholder="Choose a saved address"
                    />
                )}

                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={errors.fullName ? "border-red-500" : ""}
                    />
                    {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
                </div>

                {/* Email & Phone */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className={errors.email ? "border-red-500" : ""}
                            disabled={!!customer} // Disable if logged in
                        />
                        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1 234 567 8900"
                            className={errors.phone ? "border-red-500" : ""}
                        />
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                    </div>
                </div>

                {/* Address - Show form inputs */}
                {showNewAddressForm && (
                    <>
                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Address *</Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Main St, Apt 4"
                                className={errors.address ? "border-red-500" : ""}
                            />
                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                        </div>

                        {/* City, Postal, Country */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="New York"
                                    className={errors.city ? "border-red-500" : ""}
                                />
                                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code *</Label>
                                <Input
                                    id="postalCode"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    placeholder="10001"
                                    className={errors.postalCode ? "border-red-500" : ""}
                                />
                                {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country *</Label>
                                <Input
                                    id="country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="United States"
                                    className={errors.country ? "border-red-500" : ""}
                                />
                                {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                            </div>
                        </div>

                        {/* Save Address Checkbox (only for logged-in users) */}
                        {customer && (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="saveAddress"
                                    checked={saveAddress}
                                    onChange={(e) => setSaveAddress(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="saveAddress" className="text-sm font-normal cursor-pointer">
                                    Save this address for future orders
                                </Label>
                            </div>
                        )}
                    </>
                )}

                {/* Show summary if using saved address */}
                {!showNewAddressForm && formData.address && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Shipping to:</p>
                        <p className="font-medium">{formData.fullName}</p>
                        <p className="text-sm text-gray-700">{formData.address}</p>
                        <p className="text-sm text-gray-700">
                            {formData.city}, {formData.postalCode}
                        </p>
                        <p className="text-sm text-gray-700">{formData.country}</p>
                        <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-sm"
                            onClick={() => setShowNewAddressForm(true)}
                        >
                            Edit address
                        </Button>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                <Button type="button" variant="ghost" asChild>
                    <Link href={`/${tenantSlug}/cart`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Cart
                    </Link>
                </Button>
                <Button type="submit">
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}
