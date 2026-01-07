import {
    PluginCommonModule,
    VendurePlugin,
    EventBus,
    TransactionalConnection,
    CustomerEvent,
    Injector,
} from '@vendure/core';

/**
 * SingleChannelCustomerPlugin
 * 
 * ROOT CAUSE FIX: Vendure by default adds customers to ALL channels.
 * This plugin ensures customers are ONLY in the channel where they registered.
 * 
 * How it works:
 * 1. Listen for CustomerEvent (after customer creation/registration)
 * 2. Remove customer from all channels EXCEPT the registration channel
 * 3. This prevents cross-store login
 */
@VendurePlugin({
    imports: [PluginCommonModule],
})
export class SingleChannelCustomerPlugin {
    static init() {
        return SingleChannelCustomerPlugin;
    }

    static async onBootstrap(injector: Injector) {
        const eventBus = injector.get(EventBus);
        const connection = injector.get(TransactionalConnection);

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

                    console.log(`[SingleChannelCustomerPlugin] Removed customer ${customer.id} from ${result.rowCount || 0} other channels`);
                    console.log(`[SingleChannelCustomerPlugin] Customer ${customer.id} is now ONLY in channel ${registrationChannelId}`);
                } catch (error) {
                    console.error(`[SingleChannelCustomerPlugin] Error:`, error);
                }
            }
        });
    }
}
