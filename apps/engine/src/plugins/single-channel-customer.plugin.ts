/**
 * SingleChannelCustomer Plugin for Vendure
 * 
 * ROOT CAUSE FIX: Vendure by default adds customers to ALL channels.
 * This plugin ensures customers are ONLY in the channel where they registered.
 * 
 * FIXED: Using AccountRegistrationEvent instead of CustomerEvent
 * CustomerEvent does NOT fire for Shop API registrations!
 * 
 * How it works:
 * 1. Listen for AccountRegistrationEvent (fires on Shop API registration)
 * 2. Remove customer from all channels EXCEPT the registration channel
 * 3. This prevents cross-store login
 */

import { EventBus, TransactionalConnection, AccountRegistrationEvent } from '@vendure/core';
import { INestApplication } from '@nestjs/common';

/**
 * Initialize the SingleChannelCustomer event listeners
 * Call this from bootstrap() after Vendure starts
 */
export async function initializeSingleChannelCustomerListeners(app: INestApplication): Promise<void> {
    const eventBus = app.get(EventBus);
    const connection = app.get(TransactionalConnection);

    console.log('[SingleChannelCustomerPlugin] 🔒 Initializing customer channel isolation...');

    // Listen for ACCOUNT REGISTRATION events (from Shop API)
    eventBus.ofType(AccountRegistrationEvent).subscribe(async (event) => {
        const ctx = event.ctx;
        const customer = event.customer;
        const registrationChannelId = ctx.channelId;

        console.log(`[SingleChannelCustomerPlugin] 🆕 Customer ${customer.id} (${customer.emailAddress}) registered in channel ${registrationChannelId}`);

        try {
            // Get raw connection and delete from other channels
            const rawConnection = connection.rawConnection;

            // Remove from all channels except the registration channel
            const result = await rawConnection.query(
                `DELETE FROM customer_channels_channel 
                 WHERE "customerId" = $1 AND "channelId" != $2`,
                [customer.id, registrationChannelId]
            );

            const deletedCount = result.rowCount || (Array.isArray(result) ? result.length : 0);

            if (deletedCount > 0) {
                console.log(`[SingleChannelCustomerPlugin] ✅ Removed customer ${customer.id} from ${deletedCount} other channels`);
            }
            console.log(`[SingleChannelCustomerPlugin] 🔐 Customer ${customer.id} is now ONLY in channel ${registrationChannelId}`);
        } catch (error) {
            console.error(`[SingleChannelCustomerPlugin] ❌ Error:`, error);
        }
    });

    console.log('[SingleChannelCustomerPlugin] ✅ Customer channel isolation active!');
    console.log('[SingleChannelCustomerPlugin] 📢 Listening for AccountRegistrationEvent (Shop API registrations)');
}
