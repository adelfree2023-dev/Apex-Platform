"use client";

import { TenantSessionGuard } from "./tenant-session-guard";

interface TenantAuthGuardWrapperProps {
    tenantSlug: string;
    channelToken: string;
    children: React.ReactNode;
}

/**
 * Client-side wrapper for TenantSessionGuard
 * Use this in Server Components to include the guard
 */
export function TenantAuthGuardWrapper({
    tenantSlug,
    channelToken,
    children
}: TenantAuthGuardWrapperProps) {
    return (
        <>
            <TenantSessionGuard tenantSlug={tenantSlug} channelToken={channelToken} />
            {children}
        </>
    );
}
