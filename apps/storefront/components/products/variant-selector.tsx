"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface VariantOption {
    code: string;
    name: string;
}

interface ProductVariant {
    id: string;
    sku?: string;
    name?: string;
    price: number;
    priceWithTax: number;
    currencyCode: string;
    stockLevel?: string;
    options?: VariantOption[];
}

interface VariantSelectorProps {
    variants: ProductVariant[];
    selectedVariantId: string;
    onVariantChange: (variant: ProductVariant) => void;
}

export function VariantSelector({
    variants,
    selectedVariantId,
    onVariantChange,
}: VariantSelectorProps) {
    // If only one variant, don't show selector
    if (variants.length <= 1) {
        return null;
    }

    // Group variants by option type (e.g., Size, Color)
    const optionGroups = extractOptionGroups(variants);

    return (
        <div className="space-y-4">
            {optionGroups.length > 0 ? (
                // Show grouped options if available
                optionGroups.map((group) => (
                    <div key={group.name} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            {group.name}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {group.options.map((option) => {
                                const matchingVariant = variants.find(v =>
                                    v.options?.some(o => o.code === option.code)
                                );
                                const isSelected = matchingVariant?.id === selectedVariantId;

                                return (
                                    <button
                                        key={option.code}
                                        onClick={() => matchingVariant && onVariantChange(matchingVariant)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                                            isSelected
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-gray-200 hover:border-gray-300 text-gray-700"
                                        )}
                                    >
                                        {option.name}
                                        {isSelected && <Check className="inline-block ml-1 h-4 w-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                // Fallback: Show variant names directly
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                        Select Option
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {variants.map((variant) => {
                            const isSelected = variant.id === selectedVariantId;
                            const displayName = variant.name || variant.sku || `Option ${variant.id}`;

                            return (
                                <button
                                    key={variant.id}
                                    onClick={() => onVariantChange(variant)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                                    )}
                                >
                                    {displayName}
                                    {isSelected && <Check className="inline-block ml-1 h-4 w-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stock Status */}
            {variants.find(v => v.id === selectedVariantId)?.stockLevel && (
                <p className="text-sm text-gray-500">
                    Stock: {variants.find(v => v.id === selectedVariantId)?.stockLevel}
                </p>
            )}
        </div>
    );
}

// Helper to extract option groups from variants
function extractOptionGroups(variants: ProductVariant[]): { name: string; options: VariantOption[] }[] {
    const groups: Map<string, Set<string>> = new Map();
    const optionDetails: Map<string, VariantOption> = new Map();

    variants.forEach(variant => {
        variant.options?.forEach(option => {
            // Group name is derived from code prefix (e.g., "size-small" -> "size")
            const groupName = option.code.split('-')[0] || 'Option';

            if (!groups.has(groupName)) {
                groups.set(groupName, new Set());
            }
            groups.get(groupName)?.add(option.code);
            optionDetails.set(option.code, option);
        });
    });

    return Array.from(groups.entries()).map(([name, codes]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        options: Array.from(codes).map(code => optionDetails.get(code)!).filter(Boolean)
    }));
}
