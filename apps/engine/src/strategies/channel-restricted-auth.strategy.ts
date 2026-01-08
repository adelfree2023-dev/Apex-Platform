/**
 * Channel-Restricted Authentication Strategy for Vendure
 * 
 * PURPOSE: Prevent customers from logging into stores they're not registered in.
 * 
 * HOW IT WORKS:
 * 1. Customer tries to login
 * 2. First verify username/password using Vendure's native auth
 * 3. Then check if customer is registered in CURRENT channel
 * 4. If not in channel → reject login with error
 * 
 * This is the ROOT FIX for cross-tenant login isolation.
 */

import {
    AuthenticationStrategy,
    Injector,
    RequestContext,
    User,
    TransactionalConnection,
    NativeAuthenticationStrategy,
} from '@vendure/core';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

export interface ChannelRestrictedAuthData {
    username: string;
    password: string;
}

export const CHANNEL_RESTRICTED_AUTH_STRATEGY_NAME = 'native';

/**
 * Custom Authentication Strategy that restricts login to customers
 * who are registered in the current channel only.
 * Extends NativeAuthenticationStrategy to reuse password verification.
 */
export class ChannelRestrictedAuthStrategy extends NativeAuthenticationStrategy {

    private dbConnection!: TransactionalConnection;

    defineInputType(): DocumentNode {
        return gql`
            input NativeAuthInput {
                username: String!
                password: String!
            }
        `;
    }

    async init(injector: Injector) {
        await super.init(injector);
        this.dbConnection = injector.get(TransactionalConnection);
    }

    async authenticate(ctx: RequestContext, data: ChannelRestrictedAuthData): Promise<User | false | string> {
        // 1. Use parent's authenticate for password verification
        const result = await super.authenticate(ctx, data);

        // If parent auth failed, return the result
        if (!result || typeof result === 'string') {
            return result;
        }

        const user = result as User;

        // 2. Find customer associated with this user
        const customer = await this.dbConnection.rawConnection.query(
            `SELECT id FROM customer WHERE "userId" = $1 LIMIT 1`,
            [user.id]
        );

        if (!customer || customer.length === 0) {
            // User exists but no customer record - might be admin, allow
            return user;
        }

        const customerId = customer[0].id;
        const currentChannelId = ctx.channelId;

        // 3. Check if customer is registered in current channel
        const channelCheck = await this.dbConnection.rawConnection.query(
            `SELECT 1 FROM customer_channels_channel 
             WHERE "customerId" = $1 AND "channelId" = $2 LIMIT 1`,
            [customerId, currentChannelId]
        );

        if (!channelCheck || channelCheck.length === 0) {
            // Customer NOT registered in this channel - REJECT LOGIN
            console.log(`[ChannelRestrictedAuth] 🚫 BLOCKED: Customer ${customerId} (${data.username}) tried to login to channel ${currentChannelId} but is not registered there.`);
            return 'You are not registered in this store. Please register first.';
        }

        // 4. Customer is in channel - allow login
        console.log(`[ChannelRestrictedAuth] ✅ ALLOWED: Customer ${customerId} (${data.username}) logged into channel ${currentChannelId}`);
        return user;
    }
}

