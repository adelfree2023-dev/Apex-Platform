'use client';

/**
 * Cart Store - Vendure-backed Cart State Management
 * 
 * This store uses Vendure's activeOrder API for cart operations.
 * The cart is automatically bound to the user via session cookies.
 * 
 * Key Differences from localStorage version:
 * - Cart persists server-side
 * - Each user has their own cart
 * - Stock validation is automatic
 * - Cart survives browser close (for logged-in users)
 */

import { useState, useEffect, useCallback } from 'react';
import {
    getCart,
    addToCart as vendureAddToCart,
    removeFromCart as vendureRemoveFromCart,
    updateCartQuantity as vendureUpdateCartQty,
    clearCart as vendureClearCart,
    orderToCartItems,
    VendureOrder,
    CartOperationResult,
} from './vendure-cart';

// =============================================================================
// Types
// =============================================================================

export interface CartItem {
    id: string; // Variant ID
    lineId: string; // Vendure order line ID (needed for updates)
    productId: string;
    name: string;
    price: number;
    quantity: number;
    slug: string;
    image?: string;
    currencyCode?: string;
}

export interface CartState {
    items: CartItem[];
    isLoading: boolean;
    error: string | null;
    totalItems: number;
    totalPrice: number;
}

export interface CartActions {
    addItem: (variantId: string, quantity?: number) => Promise<CartOperationResult>;
    removeItem: (lineId: string) => Promise<CartOperationResult>;
    updateQuantity: (lineId: string, quantity: number) => Promise<CartOperationResult>;
    clearCart: () => Promise<CartOperationResult>;
    refreshCart: () => Promise<void>;
}

// =============================================================================
// Cart Hook
// =============================================================================

/**
 * Hook to access and manage the shopping cart.
 * Uses Vendure's activeOrder API for true user+store binding.
 */
export function useCartStore(tenantSlug: string): CartState & CartActions {
    const channelToken = tenantSlug; // Channel token is the tenant slug

    // State
    const [order, setOrder] = useState<VendureOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Derived state
    const items = orderToCartItems(order) as CartItem[];
    const totalItems = order?.totalQuantity || 0;
    const totalPrice = order?.totalWithTax || 0;

    // Fetch cart on mount
    useEffect(() => {
        if (!channelToken) return;

        const fetchCart = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const activeOrder = await getCart(channelToken);
                setOrder(activeOrder);
            } catch (err) {
                console.error("Failed to fetch cart:", err);
                setError("Failed to load cart");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCart();
    }, [channelToken]);

    // Refresh cart
    const refreshCart = useCallback(async () => {
        if (!channelToken) return;
        setIsLoading(true);
        try {
            const activeOrder = await getCart(channelToken);
            setOrder(activeOrder);
            setError(null);
        } catch (err) {
            console.error("Failed to refresh cart:", err);
        } finally {
            setIsLoading(false);
        }
    }, [channelToken]);

    // Add item to cart
    const addItem = useCallback(async (variantId: string, quantity: number = 1): Promise<CartOperationResult> => {
        if (!channelToken) {
            return { success: false, message: "No channel token" };
        }

        setError(null);
        const result = await vendureAddToCart(channelToken, variantId, quantity);

        if (result.success && result.order) {
            setOrder(result.order);
        } else if (result.errorCode === "INSUFFICIENT_STOCK_ERROR") {
            setError(`Only ${result.quantityAvailable} items available`);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    }, [channelToken]);

    // Remove item from cart
    const removeItem = useCallback(async (lineId: string): Promise<CartOperationResult> => {
        if (!channelToken) {
            return { success: false, message: "No channel token" };
        }

        const result = await vendureRemoveFromCart(channelToken, lineId);

        if (result.success && result.order) {
            setOrder(result.order);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    }, [channelToken]);

    // Update item quantity
    const updateQuantity = useCallback(async (lineId: string, quantity: number): Promise<CartOperationResult> => {
        if (!channelToken) {
            return { success: false, message: "No channel token" };
        }

        setError(null);
        const result = await vendureUpdateCartQty(channelToken, lineId, quantity);

        if (result.success && result.order) {
            setOrder(result.order);
        } else if (result.errorCode === "INSUFFICIENT_STOCK_ERROR") {
            setError(`Only ${result.quantityAvailable} items available`);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    }, [channelToken]);

    // Clear entire cart
    const clearCart = useCallback(async (): Promise<CartOperationResult> => {
        if (!channelToken) {
            return { success: false, message: "No channel token" };
        }

        const result = await vendureClearCart(channelToken);

        if (result.success) {
            setOrder(null);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    }, [channelToken]);

    return {
        // State
        items,
        isLoading,
        error,
        totalItems,
        totalPrice,
        // Actions
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
    };
}

// =============================================================================
// Legacy Compatibility
// =============================================================================

/**
 * Get cart summary (backward compatible)
 */
export function useCartSummary(tenantSlug: string) {
    const { totalItems, totalPrice } = useCartStore(tenantSlug);
    return { totalItems, totalPrice };
}

/**
 * Get quantity of a specific item in cart
 */
export function useCartItemQuantity(tenantSlug: string, variantId: string): number {
    const { items } = useCartStore(tenantSlug);
    const item = items.find((i) => i.id === variantId);
    return item?.quantity || 0;
}
