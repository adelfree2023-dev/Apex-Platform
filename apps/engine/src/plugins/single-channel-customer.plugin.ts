/**
 * SingleChannelCustomer Plugin for Vendure
 * 
 * ROOT CAUSE FIX: Vendure by default adds customers to ALL channels.
 * This plugin ensures customers are ONLY in the channel where they registered.
 * 
 * How it works:
 * 1. Listen for CustomerEvent (after customer creation/registration)
 * 2. Remove customer from all channels EXCEPT the registration channel
 * 3. This prevents cross-store login
 */

import { EventBus, CustomerEvent, TransactionalConnection, Injector } from '@vendure/core';

/**
 * Initialize the SingleChannelCustomer event listeners
 * Call this from bootstrap() after Vendure starts
 */
export async function initializeSingleChannelCustomerListeners(injector: Injector): Promise<void> {
    const eventBus = injector.get(EventBus);
    const connection = injector.get(TransactionalConnection);

    console.log('[SingleChannelCustomerPlugin] 🔒 Initializing customer channel isolation...');

    // Listen for customer creation events
    eventBus.ofType(CustomerEvent).subscribe(async (event) => {
        if (event.type === 'created') {
            const ctx = event.ctx;
            const customer = event.entity;
            const registrationChannelId = ctx.channelId;

            console.log(`[SingleChannelCustomerPlugin] Customer ${customer.id} created in channel ${registrationChannelId}`);

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
                console.log(`[SingleChannelCustomerPlugin] ✅ Removed customer ${customer.id} from ${deletedCount} other channels`);
                console.log(`[SingleChannelCustomerPlugin] Customer ${customer.id} is now ONLY in channel ${registrationChannelId}`);
            } catch (error) {
                console.error(`[SingleChannelCustomerPlugin] ❌ Error:`, error);
            }
        }
    });

    console.log('[SingleChannelCustomerPlugin] ✅ Customer channel isolation active!');
}
