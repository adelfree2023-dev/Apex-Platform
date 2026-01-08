"use client";

import { useState } from "react";
import { CustomerAddress } from "@/lib/vendure-checkout";

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

    const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (newValue === "new") {
            onSelect(null); // Signal to show new address form
        } else if (newValue === "") {
            onSelect(null);
        } else {
            const selected = addresses.find((a) => a.id === newValue);
            onSelect(selected || null);
        }
    };

    if (addresses.length === 0) {
        return null; // No saved addresses
    }

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
                Saved Addresses
            </label>
            <select
                value={value}
                onChange={handleValueChange}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
                <option value="">{placeholder}</option>
                {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                        {address.fullName} - {address.streetLine1}, {address.city}
                        {address.defaultShippingAddress ? " (Default)" : ""}
                    </option>
                ))}
                <option value="new">+ Use a new address</option>
            </select>
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
