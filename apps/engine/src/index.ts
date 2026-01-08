// IMPORTANT: Sentry must be imported FIRST before any other imports
import './instrument';
import { Sentry } from './instrument';

import { bootstrap, EventBus } from '@vendure/core';
import { config } from './vendure-config';
import { initializeEmailListeners } from './plugins/manager-email-plugin';
import { initializeSingleChannelCustomerListeners } from './plugins/single-channel-customer.plugin';
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

        // Initialize email event listeners
        const eventBus = app.get(EventBus);
        initializeEmailListeners(eventBus);

        // Initialize customer isolation (single-channel per customer)
        await initializeSingleChannelCustomerListeners(app);
    })
    .catch((err: Error) => {
        // Send error to Sentry
        Sentry.captureException(err);
        console.error('Failed to start Vendure:', err);
        process.exit(1);
    });

