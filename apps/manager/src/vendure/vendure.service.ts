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

    // First get the default seller ID
    const sellerQuery = `
            query {
                sellers {
                    items {
                        id
                        name
                    }
                }
            }
        `;

    let defaultSellerId = '1';
    try {
      const sellerData = await this.client.request<{ sellers: { items: { id: string; name: string }[] } }>(sellerQuery);
      if (sellerData.sellers.items.length > 0) {
        defaultSellerId = sellerData.sellers.items[0].id;
      }
    } catch (e) {
      this.logger.warn('Could not fetch sellers, using default ID 1');
    }

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

    const variables = {
      input: {
        code: tenantSlug,
        token: tenantSlug,
        defaultLanguageCode: 'en',
        pricesIncludeTax: false,
        defaultCurrencyCode: 'USD',
        defaultSellerId: defaultSellerId,
      },
    };

    try {
      const data = await this.client.request<{ createChannel: VendureChannel }>(mutation, variables);

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
