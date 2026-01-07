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
    Logger,
    OnApplicationBootstrap,
} from '@vendure/core';
import { Injectable } from '@nestjs/common';

// Vendure Events
import {
    AccountRegistrationEvent,
    PasswordResetEvent,
    OrderStateTransitionEvent,
} from '@vendure/core';

const MANAGER_API_URL = process.env.MANAGER_API_URL || 'http://localhost:3000/api';
const loggerCtx = 'ManagerEmailPlugin';

@Injectable()
class ManagerEmailHandler implements OnApplicationBootstrap {
    constructor(private eventBus: EventBus) { }

    onApplicationBootstrap() {
        Logger.info('Initializing event listeners...', loggerCtx);

        // ========================================
        // CUSTOMER REGISTRATION
        // ========================================
        this.eventBus.ofType(AccountRegistrationEvent).subscribe(async (event) => {
            const channelCode = event.ctx.channel.code;
            const email = event.user?.identifier;

            if (email) {
                Logger.info(`📧 Sending verification email to ${email} (channel: ${channelCode})`, loggerCtx);

                try {
                    // Get customer info from event
                    const verificationToken = (event as any).user?.getNativeAuthenticationMethod?.()?.verificationToken;

                    await this.sendToManager(channelCode, 'VERIFICATION', email, {
                        firstName: 'Customer',
                        verificationUrl: this.buildUrl(channelCode, 'verify', verificationToken),
                    });

                    Logger.info(`✅ Verification email sent to ${email}`, loggerCtx);
                } catch (error: any) {
                    Logger.error(`❌ Failed to send verification email: ${error.message}`, loggerCtx);
                }
            }
        });

        // ========================================
        // PASSWORD RESET
        // ========================================
        this.eventBus.ofType(PasswordResetEvent).subscribe(async (event) => {
            const channelCode = event.ctx.channel.code;
            const email = event.user?.identifier;

            if (email) {
                Logger.info(`📧 Sending password reset email to ${email}`, loggerCtx);

                try {
                    const resetToken = (event as any).user?.getNativeAuthenticationMethod?.()?.passwordResetToken;

                    await this.sendToManager(channelCode, 'PASSWORD_RESET', email, {
                        resetUrl: this.buildUrl(channelCode, 'reset-password', resetToken),
                    });

                    Logger.info(`✅ Password reset email sent to ${email}`, loggerCtx);
                } catch (error: any) {
                    Logger.error(`❌ Failed to send reset email: ${error.message}`, loggerCtx);
                }
            }
        });

        Logger.info('✅ Event listeners registered successfully!', loggerCtx);
    }

    private async sendToManager(
        tenantId: string,
        type: string,
        toEmail: string,
        data: Record<string, any>
    ): Promise<void> {
        const url = `${MANAGER_API_URL}/internal/send-email`;

        Logger.verbose(`Calling Manager API: ${url}`, loggerCtx);

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
            throw new Error(`Manager API error ${response.status}: ${text}`);
        }
    }

    private buildUrl(channelCode: string, action: string, token?: string): string {
        const baseUrl = process.env.STOREFRONT_URL || 'https://kitvet.com';
        return `${baseUrl}/${channelCode}/auth/${action}?token=${token || ''}`;
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [ManagerEmailHandler],
})
export class ManagerEmailPlugin { }
