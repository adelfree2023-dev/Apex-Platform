"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";

interface TenantSessionGuardProps {
    tenantSlug: string;
    channelToken: string;
}

/**
 * TenantSessionGuard - Ensures users can only be logged in to ONE store at a time
 * 
 * Problem: All stores share the same domain (kitvet.com), so session cookies are shared.
 * Solution: On each tenant visit, check if there's a session from a DIFFERENT tenant.
 * If so, logout and clear local state.
 */
export function TenantSessionGuard({ tenantSlug, channelToken }: TenantSessionGuardProps) {
    const { isAuthenticated, logout, user } = useAuthStore(tenantSlug);
    const { resetLocalState } = useCartStore(tenantSlug);

    useEffect(() => {
        // Check localStorage for the last tenant where user logged in
        const lastLoginTenant = localStorage.getItem("apex-last-login-tenant");

        if (isAuthenticated && lastLoginTenant && lastLoginTenant !== tenantSlug) {
            console.warn(`Session from different tenant detected: ${lastLoginTenant} vs ${tenantSlug}`);

            // Logout from Vendure (server-side session)
            fetch(process.env.NEXT_PUBLIC_VENDURE_API_URL || "http://127.0.0.1:3001/shop-api", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "vendure-token": channelToken,
                },
                credentials: "include",
                body: JSON.stringify({
                    query: `mutation { logout { success } }`,
                }),
            })
                .then(() => {
                    console.log("Logged out from cross-tenant session");
                })
                .catch((err) => {
                    console.error("Logout error:", err);
                });

            // Clear local state
            logout();
            resetLocalState();

            // Clear the last login tenant
            localStorage.removeItem("apex-last-login-tenant");

            // Reload page to ensure clean state
            window.location.reload();
        }
    }, [tenantSlug, isAuthenticated, logout, resetLocalState, channelToken]);

    // Also save current tenant when user is authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            localStorage.setItem("apex-last-login-tenant", tenantSlug);
        }
    }, [isAuthenticated, user, tenantSlug]);

    return null; // This is a logic-only component
}
