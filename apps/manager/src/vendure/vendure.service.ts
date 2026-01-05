import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';

interface VendureChannel {
  id: string;
  code: string;
  token: string;
  defaultLanguageCode: string;
}

interface VendureAuthResponse {
  login: {
    id?: string;
    identifier?: string;
    errorCode?: string;
    message?: string;
  };
}

@Injectable()
export class VendureService implements OnModuleInit {
  private client: GraphQLClient;
  private authToken: string | null = null;
  private readonly logger = new Logger(VendureService.name);
  private readonly vendureUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.vendureUrl = this.configService.get<string>('VENDURE_URL') || 'http://localhost:3001/admin-api';
    this.client = new GraphQLClient(this.vendureUrl);
  }

  async onModuleInit() {
    this.logger.log(`🔌 Connecting to Vendure at: ${this.vendureUrl}`);
  }

  /**
   * Authenticate with Vendure Admin API
   * Returns the auth token for subsequent requests
   */
  async authenticate(): Promise<string> {
    const username = this.configService.get<string>('VENDURE_SUPERADMIN_USERNAME') || 'superadmin';
    const password = this.configService.get<string>('VENDURE_SUPERADMIN_PASSWORD') || 'superadmin';

    const mutation = `
      mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          ... on CurrentUser {
            id
            identifier
          }
          ... on InvalidCredentialsError {
            errorCode
            message
          }
          ... on NativeAuthStrategyError {
            errorCode
            message
          }
        }
      }
    `;

    try {
      const response = await this.client.rawRequest<VendureAuthResponse>(mutation, {
        username,
        password,
      });

      // Extract auth token from response headers
      const authToken = response.headers.get('vendure-auth-token');

      if (!authToken) {
        throw new Error('No auth token received from Vendure');
      }

      this.authToken = authToken;
      this.client.setHeader('Authorization', `Bearer ${authToken}`);

      this.logger.log('✅ Authenticated with Vendure successfully');
      return authToken;
    } catch (error) {
      this.logger.error('❌ Vendure authentication failed', error);
      throw error;
    }
  }

  /**
   * Create a new Channel in Vendure for a tenant
   */
  async createChannel(tenantSlug: string, tenantName: string): Promise<VendureChannel> {
    // Ensure we're authenticated
    if (!this.authToken) {
      await this.authenticate();
    }

    // Get zones from the default channel (always exists)
    const defaultChannelQuery = `
      query {
        channels {
          items {
            id
            code
            defaultShippingZone { id name }
            defaultTaxZone { id name }
          }
        }
      }
    `;

    let defaultShippingZoneId: string | null = null;
    let defaultTaxZoneId: string | null = null;

    try {
      const channelData = await this.client.request<{
        channels: {
          items: {
            id: string;
            code: string;
            defaultShippingZone: { id: string; name: string } | null;
            defaultTaxZone: { id: string; name: string } | null;
          }[];
        };
      }>(defaultChannelQuery);

      // Find the __default_channel__
      const defaultChannel = channelData.channels.items.find(
        (ch) => ch.code === '__default_channel__'
      );

      if (defaultChannel) {
        if (defaultChannel.defaultShippingZone) {
          defaultShippingZoneId = defaultChannel.defaultShippingZone.id;
          this.logger.log(`Found shipping zone: ${defaultChannel.defaultShippingZone.name}`);
        }
        if (defaultChannel.defaultTaxZone) {
          defaultTaxZoneId = defaultChannel.defaultTaxZone.id;
          this.logger.log(`Found tax zone: ${defaultChannel.defaultTaxZone.name}`);
        }
      }
    } catch (e) {
      this.logger.warn('Could not fetch default channel zones');
    }

    // If no zones found, we need to create them or skip the zone fields
    const mutation = `
      mutation CreateChannel($input: CreateChannelInput!) {
        createChannel(input: $input) {
          ... on Channel {
            id
            code
            token
            defaultLanguageCode
          }
          ... on LanguageNotAvailableError {
            errorCode
            message
          }
        }
      }
    `;

    const input: Record<string, unknown> = {
      code: tenantSlug,
      token: tenantSlug,
      defaultLanguageCode: 'en',
      pricesIncludeTax: false,
      defaultCurrencyCode: 'USD',
    };

    // Only add zone IDs if we found them
    if (defaultShippingZoneId) {
      input.defaultShippingZoneId = defaultShippingZoneId;
    }
    if (defaultTaxZoneId) {
      input.defaultTaxZoneId = defaultTaxZoneId;
    }

    try {
      const data = await this.client.request<{ createChannel: VendureChannel }>(mutation, { input });

      this.logger.log(`✅ Created Vendure Channel: ${data.createChannel.code} (ID: ${data.createChannel.id})`);
      return data.createChannel;
    } catch (error) {
      this.logger.error(`❌ Failed to create channel for tenant: ${tenantSlug}`, error);
      throw error;
    }
  }

  /**
   * Get a channel by its code
   */
  async getChannelByCode(code: string): Promise<VendureChannel | null> {
    if (!this.authToken) {
      await this.authenticate();
    }

    const query = `
      query GetChannels {
        channels {
          items {
            id
            code
            token
            defaultLanguageCode
          }
        }
      }
    `;

    try {
      const data = await this.client.request<{ channels: { items: VendureChannel[] } }>(query);
      return data.channels.items.find((ch) => ch.code === code) || null;
    } catch (error) {
      this.logger.error(`❌ Failed to get channel: ${code}`, error);
      throw error;
    }
  }

  /**
   * Delete a channel (for rollback scenarios)
   */
  async deleteChannel(channelId: string): Promise<boolean> {
    if (!this.authToken) {
      await this.authenticate();
    }

    const mutation = `
      mutation DeleteChannel($id: ID!) {
        deleteChannel(id: $id) {
          result
          message
        }
      }
    `;

    try {
      await this.client.request(mutation, { id: channelId });
      this.logger.log(`🗑️ Deleted Vendure Channel: ${channelId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to delete channel: ${channelId}`, error);
      return false;
    }
  }

  /**
   * Check if Vendure is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const query = `{ __typename }`;
      await this.client.request(query);
      return true;
    } catch {
      return false;
    }
  }
}
