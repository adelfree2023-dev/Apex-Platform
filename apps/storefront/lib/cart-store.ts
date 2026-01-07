'use client';

/**
 * Cart Store - Vendure-backed Cart State Management using Zustand
 * 
 * This store uses Vendure's activeOrder API for cart operations.
 * Uses Zustand for SHARED state across all components.
 * 
 * Key Features:
 * - Single shared cart state across ALL components
 * - Server-side persistence via Vendure
 * - Automatic user binding via session cookies
 * - Real-time stock validation
 */

import { create } from 'zustand';
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
    lineId: string; // Vendure order line ID
    productId: string;
    name: string;
    price: number;
    quantity: number;
    slug: string;
    image?: string;
    currencyCode?: string;
}

interface CartStoreState {
    order: VendureOrder | null;
    isLoading: boolean;
    error: string | null;
    channelToken: string;
    _hasHydrated: boolean;
}

interface CartStoreActions {
    setOrder: (order: VendureOrder | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setChannelToken: (token: string) => void;
    setHydrated: (hydrated: boolean) => void;
}

// =============================================================================
// Zustand Store - Per Tenant
// =============================================================================

const storeCache: Record<string, ReturnType<typeof createCartZustandStore>> = {};

function createCartZustandStore(tenantSlug: string) {
    return create<CartStoreState & CartStoreActions>((set) => ({
        order: null,
        isLoading: true,
        error: null,
        channelToken: tenantSlug,
        _hasHydrated: false,
        setOrder: (order) => set({ order }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setChannelToken: (channelToken) => set({ channelToken }),
        setHydrated: (_hasHydrated) => set({ _hasHydrated }),
    }));
}

function getOrCreateStore(tenantSlug: string) {
    if (!storeCache[tenantSlug]) {
        storeCache[tenantSlug] = createCartZustandStore(tenantSlug);
    }
    return storeCache[tenantSlug];
}

// =============================================================================
// Cart Hook - Uses Shared Zustand Store
// =============================================================================

export function useCartStore(tenantSlug: string) {
    const store = getOrCreateStore(tenantSlug);
    const {
        order,
        isLoading,
        error,
        _hasHydrated,
        setOrder,
        setLoading,
        setError,
        setHydrated,
    } = store();

    // Derived state
    const items = orderToCartItems(order) as CartItem[];
    const totalItems = order?.totalQuantity || 0;
    const totalPrice = order?.totalWithTax || 0;

    // Fetch cart on first mount (hydration)
    if (!_hasHydrated && typeof window !== 'undefined') {
        setHydrated(true);
        fetchCartData(tenantSlug, setOrder, setLoading, setError);
    }

    // Refresh cart from server
    const refreshCart = async () => {
        await fetchCartData(tenantSlug, setOrder, setLoading, setError);
    };

    // Add item to cart
    const addItem = async (variantId: string, quantity: number = 1): Promise<CartOperationResult> => {
        setError(null);
        const result = await vendureAddToCart(tenantSlug, variantId, quantity);

        if (result.success && result.order) {
            setOrder(result.order);
        } else if (result.errorCode === "INSUFFICIENT_STOCK_ERROR") {
            setError(`Only ${result.quantityAvailable} items available`);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    };

    // Remove item from cart
    const removeItem = async (lineId: string): Promise<CartOperationResult> => {
        const result = await vendureRemoveFromCart(tenantSlug, lineId);

        if (result.success && result.order) {
            setOrder(result.order);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    };

    // Update item quantity
    const updateQuantity = async (lineId: string, quantity: number): Promise<CartOperationResult> => {
        setError(null);
        const result = await vendureUpdateCartQty(tenantSlug, lineId, quantity);

        if (result.success && result.order) {
            setOrder(result.order);
        } else if (result.errorCode === "INSUFFICIENT_STOCK_ERROR") {
            setError(`Only ${result.quantityAvailable} items available`);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    };

    // Clear entire cart
    const clearCart = async (): Promise<CartOperationResult> => {
        const result = await vendureClearCart(tenantSlug);

        if (result.success) {
            setOrder(null);
        } else if (result.message) {
            setError(result.message);
        }

        return result;
    };

    // Reset local state only (used for logout - cart stays on server)
    const resetLocalState = () => {
        setOrder(null);
        setError(null);
        setHydrated(false); // Will re-fetch on next mount
    };

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
        resetLocalState, // NEW: For logout
    };
}

// =============================================================================
// Helper Functions
// =============================================================================

async function fetchCartData(
    channelToken: string,
    setOrder: (order: VendureOrder | null) => void,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
) {
    setLoading(true);
    setError(null);
    try {
        const activeOrder = await getCart(channelToken);
        setOrder(activeOrder);
    } catch (err) {
        console.error("Failed to fetch cart:", err);
        setError("Failed to load cart");
    } finally {
        setLoading(false);
    }
}

// =============================================================================
// Legacy Compatibility
// =============================================================================

export function useCartSummary(tenantSlug: string) {
    const { totalItems, totalPrice } = useCartStore(tenantSlug);
    return { totalItems, totalPrice };
}

export function useCartItemQuantity(tenantSlug: string, variantId: string): number {
    const { items } = useCartStore(tenantSlug);
    const item = items.find((i) => i.id === variantId);
    return item?.quantity || 0;
}
