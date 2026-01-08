/**
 * Vendure Checkout API Client
 * 
 * This module handles checkout operations using Vendure's Shop API.
 * Includes: customer data, addresses, shipping methods, order state transitions.
 * 
 * Key Features:
 * - Pre-fill checkout with customer data
 * - Manage saved addresses
 * - Set shipping/billing addresses on order
 * - Select shipping method
 */

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

// =============================================================================
// Types
// =============================================================================

export interface CustomerAddress {
    id: string;
    fullName: string;
    company?: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province?: string;
    postalCode: string;
    country: {
        code: string;
        name: string;
    };
    phoneNumber?: string;
    defaultShippingAddress: boolean;
    defaultBillingAddress: boolean;
}

export interface ActiveCustomer {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    phoneNumber?: string;
    addresses: CustomerAddress[];
}

export interface ShippingMethod {
    id: string;
    name: string;
    description: string;
    price: number;
    priceWithTax: number;
}

export interface CheckoutResult {
    success: boolean;
    errorCode?: string;
    message?: string;
}

export interface AddressInput {
    fullName: string;
    company?: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province?: string;
    postalCode: string;
    countryCode: string;
    phoneNumber?: string;
    defaultShippingAddress?: boolean;
    defaultBillingAddress?: boolean;
}

// =============================================================================
// GraphQL Queries & Mutations
// =============================================================================

const GET_ACTIVE_CUSTOMER = `
    query GetActiveCustomer {
        activeCustomer {
            id
            firstName
            lastName
            emailAddress
            phoneNumber
            addresses {
                id
                fullName
                company
                streetLine1
                streetLine2
                city
                province
                postalCode
                country { code name }
                phoneNumber
                defaultShippingAddress
                defaultBillingAddress
            }
        }
    }
`;

const GET_ELIGIBLE_SHIPPING_METHODS = `
    query GetEligibleShippingMethods {
        eligibleShippingMethods {
            id
            name
            description
            price
            priceWithTax
        }
    }
`;

const SET_ORDER_SHIPPING_ADDRESS = `
    mutation SetOrderShippingAddress($input: CreateAddressInput!) {
        setOrderShippingAddress(input: $input) {
            ... on Order {
                id
                shippingAddress {
                    fullName
                    streetLine1
                    city
                    postalCode
                    country
                }
            }
            ... on NoActiveOrderError {
                errorCode
                message
            }
        }
    }
`;

const SET_ORDER_BILLING_ADDRESS = `
    mutation SetOrderBillingAddress($input: CreateAddressInput!) {
        setOrderBillingAddress(input: $input) {
            ... on Order {
                id
                billingAddress {
                    fullName
                    streetLine1
                    city
                }
            }
            ... on NoActiveOrderError {
                errorCode
                message
            }
        }
    }
`;

const SET_ORDER_SHIPPING_METHOD = `
    mutation SetOrderShippingMethod($shippingMethodId: [ID!]!) {
        setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
            ... on Order {
                id
                shipping
                shippingWithTax
                shippingLines {
                    shippingMethod { id name }
                    priceWithTax
                }
            }
            ... on OrderModificationError {
                errorCode
                message
            }
            ... on IneligibleShippingMethodError {
                errorCode
                message
            }
            ... on NoActiveOrderError {
                errorCode
                message
            }
        }
    }
`;

const CREATE_CUSTOMER_ADDRESS = `
    mutation CreateCustomerAddress($input: CreateAddressInput!) {
        createCustomerAddress(input: $input) {
            id
            fullName
            streetLine1
            city
            defaultShippingAddress
            defaultBillingAddress
        }
    }
`;

const TRANSITION_ORDER_TO_STATE = `
    mutation TransitionOrderToState($state: String!) {
        transitionOrderToState(state: $state) {
            ... on Order {
                id
                code
                state
            }
            ... on OrderStateTransitionError {
                errorCode
                message
                transitionError
            }
        }
    }
`;

// =============================================================================
// Helper Functions
// =============================================================================

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
        credentials: "include",
        body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
        console.error("Vendure Checkout API errors:", result.errors);
        throw new Error(result.errors[0]?.message || "API Error");
    }

    return result.data;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get the currently logged-in customer with their saved addresses
 */
export async function getActiveCustomer(channelToken: string): Promise<ActiveCustomer | null> {
    try {
        const data = await vendureRequest<{ activeCustomer: ActiveCustomer | null }>(
            channelToken,
            GET_ACTIVE_CUSTOMER
        );
        return data.activeCustomer;
    } catch (error) {
        console.error("Failed to get active customer:", error);
        return null;
    }
}

/**
 * Get available shipping methods for the current order
 */
export async function getEligibleShippingMethods(channelToken: string): Promise<ShippingMethod[]> {
    try {
        const data = await vendureRequest<{ eligibleShippingMethods: ShippingMethod[] }>(
            channelToken,
            GET_ELIGIBLE_SHIPPING_METHODS
        );
        return data.eligibleShippingMethods || [];
    } catch (error) {
        console.error("Failed to get shipping methods:", error);
        return [];
    }
}

/**
 * Set the shipping address for the current order
 */
export async function setOrderShippingAddress(
    channelToken: string,
    address: AddressInput
): Promise<CheckoutResult> {
    try {
        const data = await vendureRequest<{
            setOrderShippingAddress: { id: string } | { errorCode: string; message: string };
        }>(channelToken, SET_ORDER_SHIPPING_ADDRESS, { input: address });

        const result = data.setOrderShippingAddress;

        if ("errorCode" in result) {
            return { success: false, errorCode: result.errorCode, message: result.message };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to set shipping address",
        };
    }
}

/**
 * Set the billing address for the current order
 */
export async function setOrderBillingAddress(
    channelToken: string,
    address: AddressInput
): Promise<CheckoutResult> {
    try {
        const data = await vendureRequest<{
            setOrderBillingAddress: { id: string } | { errorCode: string; message: string };
        }>(channelToken, SET_ORDER_BILLING_ADDRESS, { input: address });

        const result = data.setOrderBillingAddress;

        if ("errorCode" in result) {
            return { success: false, errorCode: result.errorCode, message: result.message };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to set billing address",
        };
    }
}

/**
 * Set the shipping method for the current order
 */
export async function setOrderShippingMethod(
    channelToken: string,
    shippingMethodId: string
): Promise<CheckoutResult> {
    try {
        const data = await vendureRequest<{
            setOrderShippingMethod: { id: string } | { errorCode: string; message: string };
        }>(channelToken, SET_ORDER_SHIPPING_METHOD, { shippingMethodId: [shippingMethodId] });

        const result = data.setOrderShippingMethod;

        if ("errorCode" in result) {
            return { success: false, errorCode: result.errorCode, message: result.message };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to set shipping method",
        };
    }
}

/**
 * Create a new address for the logged-in customer
 */
export async function createCustomerAddress(
    channelToken: string,
    address: AddressInput
): Promise<{ success: boolean; addressId?: string; message?: string }> {
    try {
        const data = await vendureRequest<{
            createCustomerAddress: { id: string };
        }>(channelToken, CREATE_CUSTOMER_ADDRESS, { input: address });

        return { success: true, addressId: data.createCustomerAddress.id };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to create address",
        };
    }
}

/**
 * Transition the order to Next state (e.g., ArrangingPayment)
 */
export async function transitionOrderToState(
    channelToken: string,
    state: string
): Promise<CheckoutResult & { orderCode?: string }> {
    try {
        const data = await vendureRequest<{
            transitionOrderToState: { id: string; code: string; state: string } | { errorCode: string; message: string };
        }>(channelToken, TRANSITION_ORDER_TO_STATE, { state });

        const result = data.transitionOrderToState;

        if ("errorCode" in result) {
            return { success: false, errorCode: result.errorCode, message: result.message };
        }

        return { success: true, orderCode: result.code };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Failed to transition order state",
        };
    }
}

// =============================================================================
// Helper: Convert Customer Address to AddressInput format
// =============================================================================

export function customerAddressToInput(address: CustomerAddress): AddressInput {
    return {
        fullName: address.fullName,
        company: address.company,
        streetLine1: address.streetLine1,
        streetLine2: address.streetLine2,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        countryCode: address.country.code,
        phoneNumber: address.phoneNumber,
    };
}
