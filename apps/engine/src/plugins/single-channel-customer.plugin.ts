/**
 * SingleChannelCustomer Plugin for Vendure
 * 
 * ROOT CAUSE FIX: Vendure by default adds customers to ALL channels.
 * This plugin ensures customers are ONLY in the channel where they registered.
 * 
 * FIX v4: DELAYED EXECUTION
 * Vendure adds customer to channels AFTER the event fires!
 * We must wait for Vendure to complete, then delete from other channels.
 * 
 * How it works:
 * 1. Listen for AccountRegistrationEvent
 * 2. WAIT 2 seconds for Vendure to complete channel assignments
 * 3. Query customer by email
 * 4. DELETE from all channels except registration channel
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

    console.log('[SingleChannelCustomerPlugin] 🔒 Initializing customer channel isolation v4 (DELAYED)...');

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
        console.log(`[SingleChannelCustomerPlugin] ⏳ Waiting 2 seconds for Vendure to complete channel assignments...`);

        // CRITICAL FIX: Wait for Vendure to complete adding to all channels
        // Vendure adds to channels AFTER the event fires!
        setTimeout(async () => {
            try {
                const rawConnection = connection.rawConnection;

                // STEP 1: Find customer by email
                const customerResult = await rawConnection.query(
                    `SELECT id FROM customer WHERE "emailAddress" = $1 LIMIT 1`,
                    [userEmail]
                );

                if (!customerResult || customerResult.length === 0) {
                    console.error(`[SingleChannelCustomerPlugin] ❌ Customer not found for email: ${userEmail}`);
                    return;
                }

                const customerId = customerResult[0].id;

                // STEP 2: Check current channels BEFORE delete
                const beforeChannels = await rawConnection.query(
                    `SELECT "channelId" FROM customer_channels_channel WHERE "customerId" = $1`,
                    [customerId]
                );
                console.log(`[SingleChannelCustomerPlugin] 📋 Customer ${customerId} is in channels: ${beforeChannels.map((c: any) => c.channelId).join(', ')}`);

                // STEP 3: DELETE from all channels except registration channel
                const deleteResult = await rawConnection.query(
                    `DELETE FROM customer_channels_channel 
                     WHERE "customerId" = $1 AND "channelId" != $2
                     RETURNING "channelId"`,
                    [customerId, registrationChannelId]
                );

                const deletedChannels = deleteResult.map ? deleteResult.map((r: any) => r.channelId) : [];

                if (deletedChannels.length > 0) {
                    console.log(`[SingleChannelCustomerPlugin] ✅ DELETED customer ${customerId} from channels: ${deletedChannels.join(', ')}`);
                } else {
                    console.log(`[SingleChannelCustomerPlugin] ✓ Customer ${customerId} was already only in channel ${registrationChannelId}`);
                }

                // STEP 4: Verify after delete
                const afterChannels = await rawConnection.query(
                    `SELECT "channelId" FROM customer_channels_channel WHERE "customerId" = $1`,
                    [customerId]
                );
                console.log(`[SingleChannelCustomerPlugin] 🔐 Customer ${customerId} (${userEmail}) now ONLY in channels: ${afterChannels.map((c: any) => c.channelId).join(', ')}`);

            } catch (error) {
                console.error(`[SingleChannelCustomerPlugin] ❌ Error:`, error);
            }
        }, 2000); // Wait 2 seconds for Vendure to complete
    });

    console.log('[SingleChannelCustomerPlugin] ✅ Customer channel isolation v4 active!');
    console.log('[SingleChannelCustomerPlugin] 📢 Uses 2-second delay to run AFTER Vendure completes channel assignments');
}
