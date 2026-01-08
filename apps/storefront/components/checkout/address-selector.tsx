"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CustomerAddress } from "@/lib/vendure-checkout";
import { MapPin, Plus } from "lucide-react";

interface AddressSelectorProps {
    addresses: CustomerAddress[];
    onSelect: (address: CustomerAddress | null) => void;
    selectedAddressId?: string;
    placeholder?: string;
}

export function AddressSelector({
    addresses,
    onSelect,
    selectedAddressId,
    placeholder = "Select an address",
}: AddressSelectorProps) {
    const [value, setValue] = useState(selectedAddressId || "");

    const handleValueChange = (newValue: string) => {
        setValue(newValue);

        if (newValue === "new") {
            onSelect(null); // Signal to show new address form
        } else {
            const selected = addresses.find((a) => a.id === newValue);
            onSelect(selected || null);
        }
    };

    if (addresses.length === 0) {
        return null; // No saved addresses
    }

    // Find default shipping address
    const defaultAddress = addresses.find((a) => a.defaultShippingAddress);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
                Saved Addresses
            </label>
            <Select value={value} onValueChange={handleValueChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>
                                    {address.fullName} - {address.streetLine1}, {address.city}
                                </span>
                                {address.defaultShippingAddress && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                        Default
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                    <SelectItem value="new">
                        <div className="flex items-center gap-2 text-primary">
                            <Plus className="h-4 w-4" />
                            <span>Use a new address</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

// Helper component to display a single address
export function AddressCard({
    address,
    isSelected,
    onClick,
}: {
    address: CustomerAddress;
    isSelected?: boolean;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-medium">{address.fullName}</p>
                    <p className="text-sm text-gray-600">{address.streetLine1}</p>
                    {address.streetLine2 && (
                        <p className="text-sm text-gray-600">{address.streetLine2}</p>
                    )}
                    <p className="text-sm text-gray-600">
                        {address.city}, {address.province} {address.postalCode}
                    </p>
                    <p className="text-sm text-gray-600">{address.country.name}</p>
                    {address.phoneNumber && (
                        <p className="text-sm text-gray-500 mt-1">{address.phoneNumber}</p>
                    )}
                </div>
                {address.defaultShippingAddress && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Default
                    </span>
                )}
            </div>
        </div>
    );
}
