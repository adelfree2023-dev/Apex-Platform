import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLClient } from 'graphql-request';

interface VendureChannel {
  id: string;
  code: string;
  token: string;
  defaultLanguageCode: string;
}

interface VendureZone {
  id: string;
  name: string;
}

@Injectable()
export class VendureService implements OnModuleInit {
  private client: GraphQLClient;
  private authToken: string | null = null;
  private defaultZoneId: string | null = null;
  private readonly logger = new Logger(VendureService.name);
  private readonly vendureUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.vendureUrl =
      this.configService.get<string>('VENDURE_URL') ||
      'http://localhost:3001/admin-api';
    this.client = new GraphQLClient(this.vendureUrl);
  }

  async onModuleInit() {
    this.logger.log(`🔌 Connecting to Vendure at: ${this.vendureUrl}`);

    // Wait for Vendure to be ready
    let retries = 0;
    while (retries < 10) {
      try {
        await this.authenticate();
        await this.ensureDefaultZoneExists();
        this.logger.log('✅ Vendure connection initialized successfully');
        return;
      } catch (error) {
        retries++;
        this.logger.warn(`Vendure not ready, retry ${retries}/10...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    this.logger.error('❌ Could not connect to Vendure after 10 retries');
  }

  /**
   * Authenticate with Vendure Admin API
   */
  async authenticate(): Promise<string> {
    const username =
      this.configService.get<string>('VENDURE_SUPERADMIN_USERNAME') ||
      'superadmin';
    const password =
      this.configService.get<string>('VENDURE_SUPERADMIN_PASSWORD') ||
      'superadmin';

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
        }
      }
    `;

    const response = await this.client.rawRequest<{
      login: { id?: string; identifier?: string; errorCode?: string };
    }>(mutation, { username, password });

    const authToken = response.headers.get('vendure-auth-token');
    if (!authToken) {
      throw new Error('No auth token received from Vendure');
    }

    this.authToken = authToken;
    this.client.setHeader('Authorization', `Bearer ${authToken}`);
    this.logger.log('✅ Authenticated with Vendure successfully');
    return authToken;
  }

  /**
   * CRITICAL: Ensure a default Zone exists for channel creation
   * This is the ROOT FIX - zones are REQUIRED for channels
   */
  private async ensureDefaultZoneExists(): Promise<void> {
    // First, check if zones exist
    const zonesQuery = `
      query {
        zones {
          items {
            id
            name
          }
        }
      }
    `;

    try {
      const zonesData = await this.client.request<{
        zones: { items: VendureZone[] };
      }>(zonesQuery);

      if (zonesData.zones.items.length > 0) {
        // Use the first available zone
        this.defaultZoneId = zonesData.zones.items[0].id;
        this.logger.log(
          `📍 Using existing zone: ${zonesData.zones.items[0].name} (ID: ${this.defaultZoneId})`,
        );
        return;
      }

      // No zones exist - create one
      this.logger.log('📍 No zones found, creating default zone...');
      await this.createDefaultZone();
    } catch (error) {
      this.logger.error('Failed to check/create zones', error);
      throw error;
    }
  }

  /**
   * Create a default zone for the platform
   */
  private async createDefaultZone(): Promise<void> {
    const createZoneMutation = `
      mutation CreateZone($input: CreateZoneInput!) {
        createZone(input: $input) {
          id
          name
        }
      }
    `;

    const zoneData = await this.client.request<{
      createZone: VendureZone;
    }>(createZoneMutation, {
      input: {
        name: 'Default Zone',
      },
    });

    this.defaultZoneId = zoneData.createZone.id;
    this.logger.log(
      `✅ Created default zone: ${zoneData.createZone.name} (ID: ${this.defaultZoneId})`,
    );
  }

  /**
   * Create a new Channel in Vendure for a tenant
   */
  async createChannel(
    tenantSlug: string,
    tenantName: string,
  ): Promise<VendureChannel> {
    // Ensure we're authenticated and have a zone
    if (!this.authToken) {
      await this.authenticate();
    }

    if (!this.defaultZoneId) {
      await this.ensureDefaultZoneExists();
    }

    if (!this.defaultZoneId) {
      throw new Error('No zone available for channel creation');
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
        defaultShippingZoneId: this.defaultZoneId,
        defaultTaxZoneId: this.defaultZoneId,
      },
    };

    try {
      const data = await this.client.request<{
        createChannel: VendureChannel;
      }>(mutation, variables);

      this.logger.log(
        `✅ Created Vendure Channel: ${data.createChannel.code} (ID: ${data.createChannel.id})`,
      );
      return data.createChannel;
    } catch (error) {
      this.logger.error(
        `❌ Failed to create channel for tenant: ${tenantSlug}`,
        error,
      );
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
      const data = await this.client.request<{
        channels: { items: VendureChannel[] };
      }>(query);
      return (
        data.channels.items.find(
          (ch: VendureChannel) => ch.code === code,
        ) || null
      );
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
