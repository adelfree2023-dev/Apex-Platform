"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string, channelToken: string) => Promise<boolean>;
    register: (data: RegisterData, channelToken: string) => Promise<boolean>;
    logout: () => void;
    setUser: (user: User | null) => void;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber?: string; // Built-in field in Vendure 2.x
    customFields?: {
        street?: string;
        province?: string;
        notes?: string;
    };
}

const VENDURE_API = process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api";

// Create a store factory for per-tenant auth
const authStores: Map<string, ReturnType<typeof createAuthStore>> = new Map();

function createAuthStore(tenantSlug: string) {
    return create<AuthState>()(
        persist(
            (set, get) => ({
                user: null,
                isAuthenticated: false,
                isLoading: false,

                login: async (email: string, password: string, channelToken: string) => {
                    set({ isLoading: true });
                    try {
                        const response = await fetch(VENDURE_API, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "vendure-token": channelToken,
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                query: `
                                    mutation Login($email: String!, $password: String!) {
                                        login(username: $email, password: $password) {
                                            ... on CurrentUser {
                                                id
                                                identifier
                                                channels {
                                                    token
                                                    code
                                                }
                                            }
                                            ... on InvalidCredentialsError {
                                                message
                                            }
                                        }
                                    }
                                `,
                                variables: { email, password },
                            }),
                        });

                        const result = await response.json();
                        const loginResult = result.data?.login;

                        if (loginResult?.id) {
                            // Check if customer is registered in THIS channel
                            const customerChannels = loginResult.channels || [];
                            const isInChannel = customerChannels.some(
                                (ch: { token: string }) => ch.token === channelToken
                            );

                            if (!isInChannel) {
                                // Customer registered in different store - logout and reject
                                console.warn("Customer not registered in this channel:", channelToken);
                                await fetch(VENDURE_API, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "vendure-token": channelToken,
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({
                                        query: `mutation { logout { success } }`,
                                    }),
                                });
                                set({ isLoading: false });
                                return false;
                            }

                            // Fetch full user data
                            const userResponse = await fetch(VENDURE_API, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "vendure-token": channelToken,
                                },
                                credentials: "include",
                                body: JSON.stringify({
                                    query: `
                                        query ActiveCustomer {
                                            activeCustomer {
                                                id
                                                firstName
                                                lastName
                                                emailAddress
                                            }
                                        }
                                    `,
                                }),
                            });

                            const userResult = await userResponse.json();
                            const customer = userResult.data?.activeCustomer;

                            if (customer) {
                                set({
                                    user: {
                                        id: customer.id,
                                        email: customer.emailAddress,
                                        firstName: customer.firstName,
                                        lastName: customer.lastName,
                                    },
                                    isAuthenticated: true,
                                    isLoading: false,
                                });
                                return true;
                            }
                        }

                        set({ isLoading: false });
                        return false;
                    } catch (error) {
                        console.error("Login error:", error);
                        set({ isLoading: false });
                        return false;
                    }
                },

                register: async (data: RegisterData, channelToken: string) => {
                    set({ isLoading: true });
                    try {
                        const response = await fetch(VENDURE_API, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "vendure-token": channelToken,
                            },
                            credentials: "include",
                            body: JSON.stringify({
                                query: `
                                    mutation Register($input: RegisterCustomerInput!) {
                                        registerCustomerAccount(input: $input) {
                                            ... on Success {
                                                success
                                            }
                                            ... on ErrorResult {
                                                errorCode
                                                message
                                            }
                                        }
                                    }
                                `,
                                variables: {
                                    input: {
                                        firstName: data.firstName,
                                        lastName: data.lastName,
                                        emailAddress: data.email,
                                        password: data.password,
                                        phoneNumber: data.phoneNumber || '', // Built-in field in Vendure 2.x
                                        ...(data.customFields && {
                                            customFields: data.customFields,
                                        }),
                                    },
                                },
                            }),
                        });

                        const result = await response.json();
                        const registerResult = result.data?.registerCustomerAccount;

                        set({ isLoading: false });

                        // Check for success
                        if (registerResult?.success === true) {
                            return true;
                        }

                        // Check for error (duplicate email, etc)
                        if (registerResult?.errorCode) {
                            console.error("Register error:", registerResult.errorCode, registerResult.message);
                            return false;
                        }

                        return false;
                    } catch (error) {
                        console.error("Register error:", error);
                        set({ isLoading: false });
                        return false;
                    }
                },

                logout: () => {
                    set({ user: null, isAuthenticated: false });
                },

                setUser: (user) => {
                    set({ user, isAuthenticated: !!user });
                },
            }),
            {
                name: `apex-auth-${tenantSlug}`,
            }
        )
    );
}

export function useAuthStore(tenantSlug: string) {
    if (!authStores.has(tenantSlug)) {
        authStores.set(tenantSlug, createAuthStore(tenantSlug));
    }
    return authStores.get(tenantSlug)!();
}
