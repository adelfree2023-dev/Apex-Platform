/**
 * Manager Email Plugin for Vendure
 * 
 * Routes all customer emails through Manager API
 * to enable tenant-specific SMTP settings.
 */

import { EventBus, User } from '@vendure/core';
import { AccountRegistrationEvent, PasswordResetEvent } from '@vendure/core';

const MANAGER_API_URL = process.env.MANAGER_API_URL || 'http://localhost:3000/api';
const STOREFRONT_URL = process.env.STOREFRONT_URL || 'https://kitvet.com';

/**
 * Extract verification token from Vendure User object
 */
function getVerificationToken(user: User | undefined): string {
    if (!user) return '';

    // Try to get native auth method and its verification token
    const authMethods = (user as any).authenticationMethods || [];
    for (const method of authMethods) {
        if (method.verificationToken) {
            return method.verificationToken;
        }
    }

    // Fallback: check direct property
    return (user as any).verificationToken || '';
}

/**
 * Extract password reset token from Vendure User object
 */
function getPasswordResetToken(user: User | undefined): string {
    if (!user) return '';

    const authMethods = (user as any).authenticationMethods || [];
    for (const method of authMethods) {
        if (method.passwordResetToken) {
            return method.passwordResetToken;
        }
    }

    return (user as any).passwordResetToken || '';
}

/**
 * Send email request to Manager API
 */
async function sendToManager(
    tenantId: string,
    type: string,
    toEmail: string,
    data: Record<string, any>
): Promise<void> {
    const url = `${MANAGER_API_URL}/internal/send-email`;

    console.log(`📧 [ManagerEmail] Calling ${url} for ${toEmail}`);
    console.log(`📧 [ManagerEmail] Data:`, JSON.stringify(data));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantId,
                type,
                toEmail,
                data,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ [ManagerEmail] API error ${response.status}: ${text}`);
        } else {
            console.log(`✅ [ManagerEmail] Email sent to ${toEmail}`);
        }
    } catch (error: any) {
        console.error(`❌ [ManagerEmail] Network error: ${error.message}`);
    }
}

/**
 * Build verification/reset URL with token
 */
function buildUrl(channelCode: string, action: string, token: string): string {
    return `${STOREFRONT_URL}/${channelCode}/auth/${action}?token=${encodeURIComponent(token)}`;
}

/**
 * Initialize email event listeners
 * Called from index.ts after Vendure bootstrap
 */
export function initializeEmailListeners(eventBus: EventBus): void {
    console.log('🚀 [ManagerEmailPlugin] Setting up event listeners...');

    // Listen for customer registration
    eventBus.ofType(AccountRegistrationEvent).subscribe(async (event) => {
        const channelCode = event.ctx.channel.code;
        const email = event.user?.identifier;
        const token = getVerificationToken(event.user);

        if (email) {
            console.log(`📧 [ManagerEmail] Registration detected for ${email}`);
            console.log(`📧 [ManagerEmail] Verification token: ${token ? 'present' : 'MISSING'}`);

            // Get customer name from event (if available)
            const customer = (event as any).customer;
            const firstName = customer?.firstName || 'Customer';

            const verificationUrl = buildUrl(channelCode, 'verify-email', token);
            console.log(`📧 [ManagerEmail] Verification URL: ${verificationUrl}`);

            await sendToManager(channelCode, 'VERIFICATION', email, {
                firstName,
                verificationUrl,
            });
        }
    });

    // Listen for password reset
    eventBus.ofType(PasswordResetEvent).subscribe(async (event) => {
        const channelCode = event.ctx.channel.code;
        const email = event.user?.identifier;
        const token = getPasswordResetToken(event.user);

        if (email) {
            console.log(`📧 [ManagerEmail] Password reset for ${email}`);
            console.log(`📧 [ManagerEmail] Reset token: ${token ? 'present' : 'MISSING'}`);

            const resetUrl = buildUrl(channelCode, 'reset-password', token);

            await sendToManager(channelCode, 'PASSWORD_RESET', email, {
                resetUrl,
            });
        }
    });

    console.log('✅ [ManagerEmailPlugin] Event listeners registered!');
}
