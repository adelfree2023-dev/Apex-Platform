import {
    VendureConfig,
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    LanguageCode,
} from '@vendure/core';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import path from 'path';

const IS_DEV = process.env.NODE_ENV !== 'production';

export const config: VendureConfig = {
    apiOptions: {
        port: 3001,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        adminApiPlayground: IS_DEV,
        shopApiPlayground: IS_DEV,
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        requireVerification: false, // العميل يدخل مباشرة بدون توثيق الإيميل
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME || 'superadmin',
            password: process.env.SUPERADMIN_PASSWORD || 'superadmin',
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET || 'change-me-in-production',
        },
    },
    customFields: {
        // NOTE: phoneNumber is now a built-in field in Vendure 2.x Customer entity
        // Do NOT add it here to avoid "entity already has field" error
        Customer: [
            {
                name: 'street',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Street Address' }],
                nullable: true,
                public: true,
            },
            {
                name: 'province',
                type: 'string',
                label: [{ languageCode: LanguageCode.en, value: 'Province/Governorate' }],
                nullable: true,
                public: true,
            },
            {
                name: 'notes',
                type: 'text', // text for longer content
                label: [{ languageCode: LanguageCode.en, value: 'Notes' }],
                nullable: true,
                public: true,
            },
        ],
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: false,
        migrations: [path.join(__dirname, 'migrations/*.ts')],
        logging: IS_DEV,
        database: process.env.DB_NAME || 'vendure',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5433,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    },
    paymentOptions: {
        paymentMethodHandlers: [],
    },
    plugins: [
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
        }),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),

        // Email is handled by initializeEmailListeners() in index.ts

        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
            adminUiConfig: {
                brand: 'Apex Platform',
                hideVersion: false,
            },
        }),

        // Customer Isolation handled by initializeSingleChannelCustomerListeners() in index.ts
    ],
};
