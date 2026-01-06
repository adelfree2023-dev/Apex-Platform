'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

export interface CartItem {
    id: string; // Variant ID
    productId: string;
    name: string;
    price: number;
    quantity: number;
    slug: string;
    image?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    getSummary: () => { totalItems: number; totalPrice: number };
}

// 🔥 Factory function to create a tenant-specific cart store
// Each tenant gets its own localStorage key: "apex-cart-{tenantSlug}"
const createCartStore = (tenantSlug: string) => {
    return create<CartState>()(
        persist(
            (set, get) => ({
                items: [],

                addItem: (newItem) => {
                    const items = get().items;
                    const existingItem = items.find((item) => item.id === newItem.id);

                    if (existingItem) {
                        set({
                            items: items.map((item) =>
                                item.id === newItem.id
                                    ? { ...item, quantity: item.quantity + newItem.quantity }
                                    : item
                            ),
                        });
                    } else {
                        set({ items: [...items, newItem] });
                    }
                },

                removeItem: (itemId) => {
                    set({ items: get().items.filter((item) => item.id !== itemId) });
                },

                updateQuantity: (itemId, quantity) => {
                    if (quantity <= 0) {
                        get().removeItem(itemId);
                        return;
                    }
                    set({
                        items: get().items.map((item) =>
                            item.id === itemId ? { ...item, quantity } : item
                        ),
                    });
                },

                clearCart: () => set({ items: [] }),

                getSummary: () => {
                    const items = get().items;
                    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
                    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    return { totalItems, totalPrice };
                },
            }),
            {
                // 🔥 DYNAMIC KEY: Each tenant has its own storage
                name: `apex-cart-${tenantSlug}`,
                storage: createJSONStorage(() => localStorage),
            }
        )
    );
};

// Cache of created stores to avoid recreating on each render
const storeCache: Record<string, ReturnType<typeof createCartStore>> = {};

// 🔥 Hook to get/create tenant-specific cart store
export function useCartStore(tenantSlug: string) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Create or get cached store for this tenant
    if (!storeCache[tenantSlug]) {
        storeCache[tenantSlug] = createCartStore(tenantSlug);
    }

    const store = storeCache[tenantSlug];
    const state = store();

    // Return safe defaults before hydration
    if (!mounted) {
        return {
            items: [] as CartItem[],
            addItem: () => { },
            removeItem: () => { },
            updateQuantity: () => { },
            clearCart: () => { },
            getSummary: () => ({ totalItems: 0, totalPrice: 0 }),
        };
    }

    return state;
}

// 🔥 Helper to get item quantity (for AddToCartBtn)
export function useCartItemQuantity(tenantSlug: string, itemId: string): number {
    const { items } = useCartStore(tenantSlug);
    const item = items.find((i) => i.id === itemId);
    return item?.quantity || 0;
}
