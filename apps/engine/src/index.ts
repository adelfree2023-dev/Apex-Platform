import { bootstrap } from '@vendure/core';
import { VendureConfig } from '@vendure/core';
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
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME || 'superadmin',
            password: process.env.SUPERADMIN_PASSWORD || 'superadmin',
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET || 'change-me-in-production',
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: true,
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
        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
        }),
    ],
};

// Create assets directory
import fs from 'fs';
const assetsDir = path.join(__dirname, '../static/assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Bootstrap
bootstrap(config)
    .then(() => {
        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log('🎉 VENDURE ENGINE STARTED!');
        console.log('═══════════════════════════════════════════════');
        console.log('📊 Admin UI:  http://localhost:3002/admin');
        console.log('🔌 Admin API: http://localhost:3001/admin-api');
        console.log('🛍️  Shop API:  http://localhost:3001/shop-api');
        console.log('═══════════════════════════════════════════════');
    })
    .catch((err: Error) => {
        console.error('Failed to start Vendure:', err);
        process.exit(1);
    });
