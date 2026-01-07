'use client';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingCart, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface AddToCartProps {
    product: {
        id: string; // Product ID
        variantId: string; // Specific Variant ID
        name: string;
        price: number;
        currencyCode: string;
        slug: string;
        image?: string;
    };
    tenantSlug: string;
}

export function AddToCartBtn({ product, tenantSlug }: AddToCartProps) {
    // Use Vendure-backed cart store
    const { items, addItem, updateQuantity, removeItem, isLoading } = useCartStore(tenantSlug);
    const [inputValue, setInputValue] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Find item in cart by variant ID
    const cartItem = items.find((item) => item.id === product.variantId);
    const quantity = cartItem?.quantity || 0;
    const lineId = cartItem?.lineId || "";

    // Sync input value with store quantity
    useEffect(() => {
        setInputValue(quantity.toString());
    }, [quantity]);

    const handleIncrement = async () => {
        if (quantity === 0) {
            // Add new item to cart
            setIsAdding(true);
            await addItem(product.variantId, 1);
            setIsAdding(false);
        } else if (lineId) {
            // Update existing item quantity
            await updateQuantity(lineId, quantity + 1);
        }
    };

    const handleDecrement = async () => {
        if (!lineId) return;

        if (quantity > 1) {
            await updateQuantity(lineId, quantity - 1);
        } else {
            await removeItem(lineId);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            setInputValue('');
            return;
        }
        const num = parseInt(val);
        if (!isNaN(num)) {
            setInputValue(val);
        }
    };

    const handleInputBlur = async () => {
        const num = parseInt(inputValue);
        if (isNaN(num) || num <= 0) {
            if (quantity > 0) {
                setInputValue(quantity.toString());
            } else {
                setInputValue("0");
            }
        } else if (lineId && num !== quantity) {
            await updateQuantity(lineId, num);
        }
    };

    const disabled = isLoading || isAdding;

    // Item is in cart - show quantity controls
    if (quantity > 0) {
        return (
            <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm hover:bg-white"
                    onClick={handleDecrement}
                    disabled={disabled}
                >
                    -
                </Button>
                <input
                    type="text"
                    value={disabled ? "..." : inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    disabled={disabled}
                    className="w-10 text-center bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm hover:bg-white"
                    onClick={handleIncrement}
                    disabled={disabled}
                >
                    +
                </Button>
            </div>
        );
    }

    // Item not in cart - show Add to Cart button
    return (
        <Button
            size="sm"
            onClick={handleIncrement}
            variant="default"
            disabled={disabled}
        >
            {isAdding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            Add to Cart
        </Button>
    );
}
