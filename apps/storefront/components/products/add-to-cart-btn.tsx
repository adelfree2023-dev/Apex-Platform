'use client';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AddToCartProps {
    product: {
        id: string; // Product ID
        variantId: string; // Specific Variant ID
        name: string;
        price: number;
        currencyCode: string;
        slug: string;
        image?: string;
    }
}

export function AddToCartBtn({ product }: AddToCartProps) {
    const addItem = useCartStore((state) => state.addItem);
    const items = useCartStore((state) => state.items);
    const [isAdded, setIsAdded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const quantity = items.find((item) => item.id === product.variantId)?.quantity || 0;

    const handleAddToCart = () => {
        addItem({
            id: product.variantId, // Cart uses Variant ID
            productId: product.id,
            name: product.name,
            price: product.price,
            currencyCode: product.currencyCode || 'USD',
            quantity: 1,
            slug: product.slug,
            image: product.image
        });

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000); // Reset state after 2s
    };

    return (
        <Button
            size="sm"
            onClick={handleAddToCart}
            className={isAdded ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            variant={isAdded ? "default" : "secondary"}
        >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isAdded ? "Added!" : "Add to Cart"}
            {mounted && quantity > 0 && !isAdded && (
                <span className="ml-2 bg-black/10 dark:bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                    {quantity}
                </span>
            )}
        </Button>
    );
}
