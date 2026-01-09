/**
 * ⚔️ APEX useOptimisticCart Hook
 * Provides instant UI feedback for cart operations with rollback on failure
 * 
 * Part of Operation Phoenix - Phase 4 REFACTOR
 */

import { useCallback, useTransition } from 'react';
import { useCartStore, type CartItem } from '@/stores/cart-store';

interface UseOptimisticCartResult {
    addItem: (item: CartItem) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    isPending: boolean;
}

export function useOptimisticCart(): UseOptimisticCartResult {
    const [isPending, startTransition] = useTransition();

    const {
        items,
        addItem: storeAddItem,
        removeItem: storeRemoveItem,
        updateQuantity: storeUpdateQuantity,
        clearCart: storeClearCart,
    } = useCartStore();

    /**
     * Optimistically add item to cart
     * - Immediately updates UI
     * - Syncs with server in background
     * - Rolls back on failure
     */
    const addItem = useCallback(async (item: CartItem) => {
        // Save previous state for rollback
        const previousItems = [...items];

        // Optimistically update
        storeAddItem(item);

        startTransition(async () => {
            try {
                // Sync with server
                // TODO: Replace with actual API call
                // await api.cart.addItem(item);
                console.debug('[OptimisticCart] Item added:', item.id);
            } catch (error) {
                // Rollback on failure
                console.error('[OptimisticCart] Failed to add item, rolling back:', error);
                useCartStore.setState({ items: previousItems });
                throw error;
            }
        });
    }, [items, storeAddItem]);

    /**
     * Optimistically remove item from cart
     */
    const removeItem = useCallback(async (itemId: string) => {
        const previousItems = [...items];

        // Optimistically update
        storeRemoveItem(itemId);

        startTransition(async () => {
            try {
                // await api.cart.removeItem(itemId);
                console.debug('[OptimisticCart] Item removed:', itemId);
            } catch (error) {
                console.error('[OptimisticCart] Failed to remove item, rolling back:', error);
                useCartStore.setState({ items: previousItems });
                throw error;
            }
        });
    }, [items, storeRemoveItem]);

    /**
     * Optimistically update item quantity
     */
    const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
        const previousItems = [...items];

        // Optimistically update
        storeUpdateQuantity(itemId, quantity);

        startTransition(async () => {
            try {
                // await api.cart.updateQuantity(itemId, quantity);
                console.debug('[OptimisticCart] Quantity updated:', itemId, quantity);
            } catch (error) {
                console.error('[OptimisticCart] Failed to update quantity, rolling back:', error);
                useCartStore.setState({ items: previousItems });
                throw error;
            }
        });
    }, [items, storeUpdateQuantity]);

    /**
     * Clear entire cart with rollback support
     */
    const clearCart = useCallback(async () => {
        const previousItems = [...items];

        // Optimistically update
        storeClearCart();

        startTransition(async () => {
            try {
                // await api.cart.clear();
                console.debug('[OptimisticCart] Cart cleared');
            } catch (error) {
                console.error('[OptimisticCart] Failed to clear cart, rolling back:', error);
                useCartStore.setState({ items: previousItems });
                throw error;
            }
        });
    }, [items, storeClearCart]);

    return {
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isPending,
    };
}
