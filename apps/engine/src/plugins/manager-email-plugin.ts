/**
 * Manager Email Plugin for Vendure
 * 
 * Routes all customer emails through Manager API
 * to enable tenant-specific SMTP settings.
 */

import {
    PluginCommonModule,
    VendurePlugin,
    EventBus,
} from '@vendure/core';
import {
    AccountRegistrationEvent,
    PasswordResetEvent,
} from '@vendure/core';

const MANAGER_API_URL = process.env.MANAGER_API_URL || 'http://localhost:3000/api';

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
 * Build verification/reset URL
 */
function buildUrl(channelCode: string, action: string, token?: string): string {
    const baseUrl = process.env.STOREFRONT_URL || 'https://kitvet.com';
    return `${baseUrl}/${channelCode}/auth/${action}?token=${token || ''}`;
}

/**
 * Initialize email event listeners
 */
export function initializeEmailListeners(eventBus: EventBus): void {
    console.log('🚀 [ManagerEmailPlugin] Setting up event listeners...');

    // Listen for customer registration
    eventBus.ofType(AccountRegistrationEvent).subscribe(async (event) => {
        const channelCode = event.ctx.channel.code;
        const email = event.user?.identifier;

        if (email) {
            console.log(`📧 [ManagerEmail] Registration detected for ${email}`);

            await sendToManager(channelCode, 'VERIFICATION', email, {
                firstName: 'Customer',
                verificationUrl: buildUrl(channelCode, 'verify', ''),
            });
        }
    });

    // Listen for password reset
    eventBus.ofType(PasswordResetEvent).subscribe(async (event) => {
        const channelCode = event.ctx.channel.code;
        const email = event.user?.identifier;

        if (email) {
            console.log(`📧 [ManagerEmail] Password reset for ${email}`);

            await sendToManager(channelCode, 'PASSWORD_RESET', email, {
                resetUrl: buildUrl(channelCode, 'reset-password', ''),
            });
        }
    });

    console.log('✅ [ManagerEmailPlugin] Event listeners registered!');
}

@VendurePlugin({
    imports: [PluginCommonModule],
})
export class ManagerEmailPlugin { }
