import { bootstrap, EventBus } from '@vendure/core';
import { config } from './vendure-config';
import { ManagerEmailPlugin } from './plugins/manager-email-plugin';
import path from 'path';
import fs from 'fs';

// Create assets directory
const assetsDir = path.join(__dirname, '../static/assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Bootstrap Vendure
bootstrap(config)
    .then(async (app) => {
        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log('🎉 VENDURE ENGINE STARTED!');
        console.log('═══════════════════════════════════════════════');
        console.log('📊 Admin UI:  http://localhost:3002/admin');
        console.log('🔌 Admin API: http://localhost:3001/admin-api');
        console.log('🛍️  Shop API:  http://localhost:3001/shop-api');
        console.log('═══════════════════════════════════════════════');

        // Initialize ManagerEmailPlugin event listeners
        const eventBus = app.get(EventBus);
        await ManagerEmailPlugin.onVendureBootstrap(eventBus);
    })
    .catch((err: Error) => {
        console.error('Failed to start Vendure:', err);
        process.exit(1);
    });

