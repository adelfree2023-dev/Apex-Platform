import {
    PluginCommonModule,
    VendurePlugin,
    EventBus,
    TransactionalConnection,
    Channel,
    CustomerEvent,
    ChannelService,
    RequestContext,
} from '@vendure/core';
import { OnModuleInit } from '@nestjs/common';

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
export class SingleChannelCustomerPlugin implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private connection: TransactionalConnection,
    ) { }

    async onModuleInit() {
        // Listen for customer creation events
        this.eventBus.ofType(CustomerEvent).subscribe(async (event) => {
            if (event.type === 'created') {
                const ctx = event.ctx;
                const customer = event.entity;
                const registrationChannelId = ctx.channelId;

                console.log(`[SingleChannelCustomerPlugin] Customer ${customer.id} created in channel ${registrationChannelId}`);

                // Get all channel assignments for this customer
                const customerChannels = await this.connection
                    .getRepository(ctx, 'customer_channels_channel')
                    .createQueryBuilder()
                    .where('"customerId" = :customerId', { customerId: customer.id })
                    .getRawMany();

                // Remove from all channels except the registration channel
                for (const cc of customerChannels) {
                    if (cc.channelId !== registrationChannelId) {
                        console.log(`[SingleChannelCustomerPlugin] Removing customer ${customer.id} from channel ${cc.channelId}`);

                        await this.connection
                            .getRepository(ctx, 'customer_channels_channel')
                            .createQueryBuilder()
                            .delete()
                            .where('"customerId" = :customerId AND "channelId" = :channelId', {
                                customerId: customer.id,
                                channelId: cc.channelId,
                            })
                            .execute();
                    }
                }

                console.log(`[SingleChannelCustomerPlugin] Customer ${customer.id} is now ONLY in channel ${registrationChannelId}`);
            }
        });
    }
}
