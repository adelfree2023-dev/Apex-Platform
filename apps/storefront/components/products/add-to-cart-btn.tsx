'use client';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingCart } from 'lucide-react';
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
    tenantSlug: string; // 🔥 Required for tenant isolation
}

export function AddToCartBtn({ product, tenantSlug }: AddToCartProps) {
    // 🔥 Use tenant-specific cart store
    const { items, addItem, updateQuantity, removeItem } = useCartStore(tenantSlug);
    const [inputValue, setInputValue] = useState("");

    // Find item in cart
    const cartItem = items.find((item) => item.id === product.variantId);
    const quantity = cartItem?.quantity || 0;

    // Sync input value with store quantity
    useEffect(() => {
        setInputValue(quantity.toString());
    }, [quantity]);

    const handleIncrement = () => {
        addItem({
            id: product.variantId,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            slug: product.slug,
            image: product.image,
        });
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(product.variantId, quantity - 1);
        } else {
            removeItem(product.variantId);
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
            if (num > 0) {
                updateQuantity(product.variantId, num);
            }
        }
    };

    const handleInputBlur = () => {
        const num = parseInt(inputValue);
        if (isNaN(num) || num <= 0) {
            if (quantity > 0) {
                setInputValue(quantity.toString());
            } else {
                setInputValue("1");
            }
        } else {
            updateQuantity(product.variantId, num);
        }
    };

    if (quantity > 0) {
        return (
            <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm hover:bg-white"
                    onClick={handleDecrement}
                >
                    -
                </Button>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    className="w-10 text-center bg-transparent border-none text-sm font-medium focus:outline-none focus:ring-0"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm hover:bg-white"
                    onClick={handleIncrement}
                >
                    +
                </Button>
            </div>
        );
    }

    return (
        <Button
            size="sm"
            onClick={handleIncrement}
            variant="default"
        >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
        </Button>
    );
}
