/**
 * Channel-Restricted Authentication Strategy for Vendure
 * 
 * PURPOSE: Prevent customers from logging into stores they're not registered in.
 * 
 * HOW IT WORKS:
 * 1. Customer tries to login
 * 2. First verify username/password (native auth)
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
    NativeAuthenticationMethod,
    ID,
} from '@vendure/core';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import * as bcrypt from 'bcrypt';

export interface ChannelRestrictedAuthData {
    username: string;
    password: string;
}

export const CHANNEL_RESTRICTED_AUTH_STRATEGY_NAME = 'channel-restricted';

/**
 * Custom Authentication Strategy that restricts login to customers
 * who are registered in the current channel only.
 */
export class ChannelRestrictedAuthStrategy implements AuthenticationStrategy<ChannelRestrictedAuthData> {
    readonly name = CHANNEL_RESTRICTED_AUTH_STRATEGY_NAME;

    private connection: TransactionalConnection;
    private passwordHashRounds = 12;

    defineInputType(): DocumentNode {
        return gql`
            input ChannelRestrictedAuthInput {
                username: String!
                password: String!
            }
        `;
    }

    async init(injector: Injector) {
        this.connection = injector.get(TransactionalConnection);
    }

    async authenticate(ctx: RequestContext, data: ChannelRestrictedAuthData): Promise<User | false | string> {
        const { username, password } = data;

        // 1. Find user by identifier (email)
        const user = await this.connection.rawConnection.getRepository('user').findOne({
            where: { identifier: username, deletedAt: null },
        }) as User | null;

        if (!user) {
            return false;
        }

        // 2. Verify password
        const authMethod = await this.connection.rawConnection
            .getRepository('authentication_method')
            .createQueryBuilder('auth')
            .where('auth.userId = :userId', { userId: user.id })
            .andWhere('auth.type = :type', { type: 'NativeAuthenticationMethod' })
            .getOne() as NativeAuthenticationMethod | null;

        if (!authMethod || !authMethod.passwordHash) {
            return false;
        }

        const passwordMatch = await bcrypt.compare(password, authMethod.passwordHash);
        if (!passwordMatch) {
            return false;
        }

        // 3. Find customer associated with this user
        const customer = await this.connection.rawConnection.query(
            `SELECT id FROM customer WHERE "userId" = $1 LIMIT 1`,
            [user.id]
        );

        if (!customer || customer.length === 0) {
            // User exists but no customer record - might be admin
            return user;
        }

        const customerId = customer[0].id;
        const currentChannelId = ctx.channelId;

        // 4. Check if customer is registered in current channel
        const channelCheck = await this.connection.rawConnection.query(
            `SELECT 1 FROM customer_channels_channel 
             WHERE "customerId" = $1 AND "channelId" = $2 LIMIT 1`,
            [customerId, currentChannelId]
        );

        if (!channelCheck || channelCheck.length === 0) {
            // Customer NOT registered in this channel - REJECT LOGIN
            console.log(`[ChannelRestrictedAuth] 🚫 BLOCKED: Customer ${customerId} (${username}) tried to login to channel ${currentChannelId} but is not registered there.`);
            return 'You are not registered in this store. Please register first.';
        }

        // 5. Customer is in channel - allow login
        console.log(`[ChannelRestrictedAuth] ✅ ALLOWED: Customer ${customerId} (${username}) logged into channel ${currentChannelId}`);
        return user;
    }
}
