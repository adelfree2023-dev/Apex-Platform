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
  private defaultChannelToken: string | null = null;
  private defaultZoneId: string | null = null;
  private readonly logger = new Logger(VendureService.name);
  private readonly vendureUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.vendureUrl = this.configService.get<string>('VENDURE_URL') || 'http://localhost:3001/admin-api';
    this.client = new GraphQLClient(this.vendureUrl);
  }

  async onModuleInit() {
    this.logger.log(`🔌 Connecting to Vendure at: ${this.vendureUrl}`);
    let retries = 0;
    while (retries < 10) {
      try {
        await this.authenticate();
        await this.fetchDefaultChannelToken(); // Fetch dynamically
        await this.ensureDefaultZoneExists();
        this.logger.log('✅ Vendure connection initialized successfully');
        return;
      } catch (error) {
        retries++;
        this.logger.warn(`Vendure not ready, retry ${retries}/10...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  async authenticate(): Promise<string> {
    const username = this.configService.get<string>('VENDURE_SUPERADMIN_USERNAME') || 'superadmin';
    const password = this.configService.get<string>('VENDURE_SUPERADMIN_PASSWORD') || 'superadmin';

    const mutation = `mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          ... on CurrentUser { id identifier }
        }
    }`;

    // Login does NOT require a channel token usually
    const response = await this.client.rawRequest<{ login: any }>(mutation, { username, password });
    const authToken = response.headers.get('vendure-auth-token');

    if (!authToken) throw new Error('No auth token received from Vendure');
    this.authToken = authToken;
    this.client.setHeader('Authorization', `Bearer ${authToken}`);

    this.logger.log('✅ Authenticated with Vendure successfully');
    return authToken;
  }

  private async fetchDefaultChannelToken(): Promise<void> {
    // Query ALL channels to find the default one (usually 'default' or similar)
    const channelsQuery = `query { channels { items { id code token } } }`;
    try {
      // Run WITHOUT channel header specifically to list global channels
      this.client.setHeader('vendure-token', '');
      const data = await this.client.request<{ channels: { items: VendureChannel[] } }>(channelsQuery);

      if (data.channels.items.length > 0) {
        // Pick the first channel as "Default" context
        this.defaultChannelToken = data.channels.items[0].token;
        this.client.setHeader('vendure-token', this.defaultChannelToken);
        this.logger.log(`✅ Discovered Default Channel Token: ${this.defaultChannelToken}`);
      } else {
        throw new Error('No channels found in Vendure!');
      }
    } catch (e) {
      this.logger.error('Failed to fetch channels. Is the Admin API accessible?', e);
      throw e;
    }
  }

  private async ensureDefaultZoneExists(): Promise<void> {
    const zonesQuery = `query { zones { items { id name } } }`;
    try {
      const zonesData = await this.client.request<{ zones: { items: VendureZone[] } }>(zonesQuery);
      if (zonesData.zones.items.length > 0) {
        this.defaultZoneId = zonesData.zones.items[0].id;
        return;
      }
      this.logger.log('📍 Creating default zone...');
      await this.createDefaultZone();
    } catch (error) {
      this.logger.error('Failed to check zones', error);
      throw error;
    }
  }

  private async createDefaultZone(): Promise<void> {
    const createZoneMutation = `mutation CreateZone($input: CreateZoneInput!) { createZone(input: $input) { id name } }`;
    const zoneData = await this.client.request<{ createZone: VendureZone }>(createZoneMutation, { input: { name: 'Default Zone' } });
    this.defaultZoneId = zoneData.createZone.id;
  }

  async createChannel(tenantSlug: string, tenantName: string): Promise<VendureChannel> {
    if (!this.authToken) await this.authenticate();
    if (!this.defaultChannelToken) await this.fetchDefaultChannelToken();
    if (!this.defaultZoneId) await this.ensureDefaultZoneExists();

    const mutation = `mutation CreateChannel($input: CreateChannelInput!) {
        createChannel(input: $input) {
          ... on Channel { id code token }
          ... on LanguageNotAvailableError { message }
        }
    }`;

    // Ensure we are using determining token key for channel creation context (usually default)
    this.client.setHeader('vendure-token', this.defaultChannelToken!);

    const variables = {
      input: {
        code: tenantSlug,
        token: tenantSlug,
        defaultLanguageCode: 'en',
        pricesIncludeTax: false,
        defaultCurrencyCode: 'USD',
        defaultShippingZoneId: this.defaultZoneId,
        defaultTaxZoneId: this.defaultZoneId,
      }
    };

    try {
      const data = await this.client.request<{ createChannel: VendureChannel }>(mutation, variables);
      this.logger.log(`✅ Created Vendure Channel: ${data.createChannel.code}`);
      return data.createChannel;
    } catch (error) {
      this.logger.error(`❌ Failed to create channel: ${tenantSlug}`, error);
      throw error;
    }
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    const mutation = `mutation DeleteChannel($id: ID!) { deleteChannel(id: $id) { result } }`;
    try {
      await this.client.request(mutation, { id: channelId });
      this.logger.log(`🗑️ Deleted Vendure Channel: ${channelId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to delete channel: ${channelId}`, error);
      return false;
    }
  }

  async executeGraphQL(query: string, variables?: any, channelToken?: string): Promise<any> {
    if (channelToken) {
      this.client.setHeader('vendure-token', channelToken);
    } else {
      // Fallback to discovered default token
      if (!this.defaultChannelToken) await this.fetchDefaultChannelToken();
      this.client.setHeader('vendure-token', this.defaultChannelToken!);
    }

    if (!this.authToken) await this.authenticate();

    return this.client.request(query, variables);
  }
}
