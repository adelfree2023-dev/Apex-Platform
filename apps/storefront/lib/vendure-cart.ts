/**
 * Vendure Cart API Client
 * 
 * This module handles all cart operations using Vendure's native activeOrder API.
 * Cart is automatically bound to the user via session cookies.
 * 
 * Key Benefits:
 * - Cart persists server-side (not localStorage)
 * - Automatically bound to authenticated user
 * - Stock validation on add
 * - Real-time price updates
 */

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

// =============================================================================
// Types
// =============================================================================

export interface VendureOrderLine {
    id: string;
    quantity: number;
    unitPrice: number;
    unitPriceWithTax: number;
    linePriceWithTax: number;
    productVariant: {
        id: string;
        name: string;
        sku: string;
        priceWithTax: number;
        currencyCode: string;
        product: {
            id: string;
            name: string;
            slug: string;
            featuredAsset?: {
                preview: string;
            };
        };
        stockLevel: string;
    };
}

export interface VendureOrder {
    id: string;
    code: string;
    state: string;
    totalQuantity: number;
    subTotal: number;
    subTotalWithTax: number;
    total: number;
    totalWithTax: number;
    currencyCode: string;
    lines: VendureOrderLine[];
}

export interface CartOperationResult {
    success: boolean;
    order?: VendureOrder;
    errorCode?: string;
    message?: string;
    quantityAvailable?: number;
}

// =============================================================================
// GraphQL Fragments & Queries
// =============================================================================

const ORDER_FRAGMENT = `
    fragment OrderFields on Order {
        id
        code
        state
        totalQuantity
        subTotal
        subTotalWithTax
        total
        totalWithTax
        currencyCode
        lines {
            id
            quantity
            unitPrice
            unitPriceWithTax
            linePriceWithTax
            productVariant {
                id
                name
                sku
                priceWithTax
                currencyCode
                product {
                    id
                    name
                    slug
                    featuredAsset { preview }
                }
                stockLevel
            }
        }
    }
`;

const GET_ACTIVE_ORDER = `
    query GetActiveOrder {
        activeOrder {
            ...OrderFields
        }
    }
    ${ORDER_FRAGMENT}
`;

const ADD_ITEM_TO_ORDER = `
    mutation AddItemToOrder($variantId: ID!, $quantity: Int!) {
        addItemToOrder(productVariantId: $variantId, quantity: $quantity) {
            ... on Order {
                ...OrderFields
            }
            ... on OrderModificationError {
                errorCode
                message
            }
            ... on OrderLimitError {
                errorCode
                message
                maxItems
            }
            ... on NegativeQuantityError {
                errorCode
                message
            }
            ... on InsufficientStockError {
                errorCode
                message
                quantityAvailable
            }
        }
    }
    ${ORDER_FRAGMENT}
`;

const REMOVE_ORDER_LINE = `
    mutation RemoveOrderLine($orderLineId: ID!) {
        removeOrderLine(orderLineId: $orderLineId) {
            ... on Order {
                ...OrderFields
            }
            ... on OrderModificationError {
                errorCode
                message
            }
        }
    }
    ${ORDER_FRAGMENT}
`;

const ADJUST_ORDER_LINE = `
    mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
        adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
            ... on Order {
                ...OrderFields
            }
            ... on OrderModificationError {
                errorCode
                message
            }
            ... on OrderLimitError {
                errorCode
                message
                maxItems
            }
            ... on NegativeQuantityError {
                errorCode
                message
            }
            ... on InsufficientStockError {
                errorCode
                message
                quantityAvailable
            }
        }
    }
    ${ORDER_FRAGMENT}
`;

// =============================================================================
// API Functions
// =============================================================================

/**
 * Make a request to Vendure Shop API
 */
async function vendureRequest<T>(
    channelToken: string,
    query: string,
    variables?: Record<string, unknown>
): Promise<T> {
    const response = await fetch(VENDURE_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "vendure-token": channelToken,
        },
        credentials: "include", // Important: sends session cookies
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
        console.error("Vendure API errors:", result.errors);
        throw new Error(result.errors[0]?.message || "API Error");
    }

    return result.data;
}

/**
 * Get the current user's active cart (order in "AddingItems" state)
 */
export async function getCart(channelToken: string): Promise<VendureOrder | null> {
    try {
        const data = await vendureRequest<{ activeOrder: VendureOrder | null }>(
            channelToken,
            GET_ACTIVE_ORDER
        );
        return data.activeOrder;
    } catch (error) {
        console.error("Failed to get cart:", error);
        return null;
    }
}

/**
 * Add an item to the cart
 */
export async function addToCart(
    channelToken: string,
    variantId: string,
    quantity: number = 1
): Promise<CartOperationResult> {
    try {
        const data = await vendureRequest<{ addItemToOrder: VendureOrder | { errorCode: string; message: string; quantityAvailable?: number } }>(
            channelToken,
            ADD_ITEM_TO_ORDER,
            { variantId, quantity }
        );

        const result = data.addItemToOrder;

        // Check if it's an error response
        if ("errorCode" in result) {
            return {
                success: false,
                errorCode: result.errorCode,
                message: result.message,
                quantityAvailable: (result as { quantityAvailable?: number }).quantityAvailable,
            };
        }

        return { success: true, order: result };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to add item",
        };
    }
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(
    channelToken: string,
    orderLineId: string
): Promise<CartOperationResult> {
    try {
        const data = await vendureRequest<{ removeOrderLine: VendureOrder | { errorCode: string; message: string } }>(
            channelToken,
            REMOVE_ORDER_LINE,
            { orderLineId }
        );

        const result = data.removeOrderLine;

        if ("errorCode" in result) {
            return {
                success: false,
                errorCode: result.errorCode,
                message: result.message,
            };
        }

        return { success: true, order: result };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to remove item",
        };
    }
}

/**
 * Update quantity of an item in cart
 * Pass quantity=0 to remove the item
 */
export async function updateCartQuantity(
    channelToken: string,
    orderLineId: string,
    quantity: number
): Promise<CartOperationResult> {
    // If quantity is 0 or less, remove the item
    if (quantity <= 0) {
        return removeFromCart(channelToken, orderLineId);
    }

    try {
        const data = await vendureRequest<{ adjustOrderLine: VendureOrder | { errorCode: string; message: string; quantityAvailable?: number } }>(
            channelToken,
            ADJUST_ORDER_LINE,
            { orderLineId, quantity }
        );

        const result = data.adjustOrderLine;

        if ("errorCode" in result) {
            return {
                success: false,
                errorCode: result.errorCode,
                message: result.message,
                quantityAvailable: (result as { quantityAvailable?: number }).quantityAvailable,
            };
        }

        return { success: true, order: result };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to update quantity",
        };
    }
}

/**
 * Clear all items from cart (remove each line)
 */
export async function clearCart(channelToken: string): Promise<CartOperationResult> {
    const cart = await getCart(channelToken);

    if (!cart || cart.lines.length === 0) {
        return { success: true, order: cart || undefined };
    }

    // Remove all lines
    for (const line of cart.lines) {
        const result = await removeFromCart(channelToken, line.id);
        if (!result.success) {
            return result;
        }
    }

    // Get updated empty cart
    const emptyCart = await getCart(channelToken);
    return { success: true, order: emptyCart || undefined };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert Vendure order to local CartItem format (for backward compatibility)
 */
export function orderToCartItems(order: VendureOrder | null): Array<{
    id: string;
    lineId: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    slug: string;
    image?: string;
    currencyCode: string;
}> {
    if (!order) return [];

    return order.lines.map((line) => ({
        id: line.productVariant.id,
        lineId: line.id, // Important: Vendure uses lineId for updates
        productId: line.productVariant.product.id,
        name: line.productVariant.product.name,
        price: line.unitPriceWithTax,
        quantity: line.quantity,
        slug: line.productVariant.product.slug,
        image: line.productVariant.product.featuredAsset?.preview,
        currencyCode: line.productVariant.currencyCode,
    }));
}
