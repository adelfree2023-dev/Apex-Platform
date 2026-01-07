/**
 * SingleChannelCustomer Plugin for Vendure
 * 
 * ROOT CAUSE FIX: Vendure by default adds customers to ALL channels.
 * This plugin ensures customers are ONLY in the channel where they registered.
 * 
 * FIXED v3: AccountRegistrationEvent.customer is undefined!
 * We must query the customer by email from event.user.identifier
 * 
 * How it works:
 * 1. Listen for AccountRegistrationEvent (fires on Shop API registration)
 * 2. Get customer by email from database
 * 3. Remove customer from all channels EXCEPT the registration channel
 * 4. This prevents cross-store login
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

    console.log('[SingleChannelCustomerPlugin] 🔒 Initializing customer channel isolation v3...');

    // Listen for ACCOUNT REGISTRATION events (from Shop API)
    eventBus.ofType(AccountRegistrationEvent).subscribe(async (event) => {
        const ctx = event.ctx;
        const registrationChannelId = ctx.channelId;
        const userEmail = event.user?.identifier;

        if (!userEmail) {
            console.error(`[SingleChannelCustomerPlugin] ❌ No user email in event!`);
            return;
        }

        console.log(`[SingleChannelCustomerPlugin] 🆕 Registration detected for ${userEmail} in channel ${registrationChannelId}`);

        try {
            const rawConnection = connection.rawConnection;

            // STEP 1: Find customer by email (since event.customer is undefined)
            const customerResult = await rawConnection.query(
                `SELECT id FROM customer WHERE "emailAddress" = $1 LIMIT 1`,
                [userEmail]
            );

            if (!customerResult || customerResult.length === 0) {
                console.error(`[SingleChannelCustomerPlugin] ❌ Customer not found for email: ${userEmail}`);
                return;
            }

            const customerId = customerResult[0].id;
            console.log(`[SingleChannelCustomerPlugin] 📋 Found customer ID: ${customerId}`);

            // STEP 2: Remove from all channels except the registration channel
            const deleteResult = await rawConnection.query(
                `DELETE FROM customer_channels_channel 
                 WHERE "customerId" = $1 AND "channelId" != $2
                 RETURNING "channelId"`,
                [customerId, registrationChannelId]
            );

            const deletedCount = deleteResult.length || deleteResult.rowCount || 0;

            if (deletedCount > 0) {
                console.log(`[SingleChannelCustomerPlugin] ✅ Removed customer ${customerId} from ${deletedCount} other channels`);
            } else {
                console.log(`[SingleChannelCustomerPlugin] ✓ Customer ${customerId} was already only in channel ${registrationChannelId}`);
            }

            console.log(`[SingleChannelCustomerPlugin] 🔐 Customer ${customerId} (${userEmail}) is now ONLY in channel ${registrationChannelId}`);
        } catch (error) {
            console.error(`[SingleChannelCustomerPlugin] ❌ Error:`, error);
        }
    });

    console.log('[SingleChannelCustomerPlugin] ✅ Customer channel isolation v3 active!');
    console.log('[SingleChannelCustomerPlugin] 📢 Now queries customer by email instead of relying on event.customer');
}
