/**
 * Manager Email Plugin for Vendure
 * 
 * This plugin intercepts customer events and sends email requests
 * to the Manager API, which handles tenant-specific SMTP.
 */

import { PluginCommonModule, VendurePlugin, EventBus, Ctx, ID } from '@vendure/core';
import { OnModuleInit, Injectable } from '@nestjs/common';
import { AccountRegistrationEvent, PasswordResetEvent } from '@vendure/core';

const MANAGER_API_URL = process.env.MANAGER_API_URL || 'http://localhost:3000/api';

@Injectable()
export class ManagerEmailService implements OnModuleInit {
    constructor(private eventBus: EventBus) { }

    onModuleInit() {
        // Listen for customer registration
        this.eventBus.ofType(AccountRegistrationEvent).subscribe(async (event) => {
            const channelCode = event.ctx.channel.code;
            const customer = event.user?.identifier;

            if (customer) {
                console.log(`📧 [ManagerEmail] Sending verification email to ${customer} for channel ${channelCode}`);

                try {
                    await this.sendToManager(channelCode, 'VERIFICATION', customer, {
                        firstName: (event as any).customer?.firstName || 'Customer',
                        verificationUrl: this.buildVerificationUrl(channelCode, (event as any).user?.verificationToken),
                    });
                } catch (error) {
                    console.error('❌ [ManagerEmail] Failed to send verification email:', error);
                }
            }
        });

        // Listen for password reset
        this.eventBus.ofType(PasswordResetEvent).subscribe(async (event) => {
            const channelCode = event.ctx.channel.code;
            const userEmail = event.user?.identifier;

            if (userEmail) {
                console.log(`📧 [ManagerEmail] Sending password reset email to ${userEmail}`);

                try {
                    await this.sendToManager(channelCode, 'PASSWORD_RESET', userEmail, {
                        resetUrl: this.buildResetUrl(channelCode, (event as any).user?.resetToken),
                    });
                } catch (error) {
                    console.error('❌ [ManagerEmail] Failed to send reset email:', error);
                }
            }
        });

        console.log('✅ [ManagerEmail] Event listeners registered');
    }

    private async sendToManager(
        tenantId: string,
        type: string,
        toEmail: string,
        data: Record<string, any>
    ) {
        const response = await fetch(`${MANAGER_API_URL}/internal/send-email`, {
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
            throw new Error(`Manager API error: ${response.status}`);
        }

        return response.json();
    }

    private buildVerificationUrl(channelCode: string, token: string): string {
        const baseUrl = process.env.STOREFRONT_URL || 'https://kitvet.com';
        return `${baseUrl}/${channelCode}/auth/verify?token=${token}`;
    }

    private buildResetUrl(channelCode: string, token: string): string {
        const baseUrl = process.env.STOREFRONT_URL || 'https://kitvet.com';
        return `${baseUrl}/${channelCode}/auth/reset-password?token=${token}`;
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [ManagerEmailService],
})
export class ManagerEmailPlugin { }
