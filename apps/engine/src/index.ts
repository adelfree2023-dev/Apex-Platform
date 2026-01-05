import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';

/**
 * Bootstrap the Vendure server
 */
async function startServer() {
    try {
        console.log('🔄 Running database migrations...');
        await runMigrations(config);

        console.log('🚀 Starting Vendure Engine...');
        const app = await bootstrap(config);

        console.log('');
        console.log('═══════════════════════════════════════════════');
        console.log('🎉 VENDURE ENGINE STARTED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════════════');
        console.log(`📊 Admin UI:   http://localhost:3002/admin`);
        console.log(`🔌 Admin API:  http://localhost:3001/admin-api`);
        console.log(`🛍️  Shop API:   http://localhost:3001/shop-api`);
        console.log('═══════════════════════════════════════════════');
        console.log('');
        console.log('👤 Default superadmin credentials:');
        console.log('   Username: superadmin');
        console.log('   Password: superadmin');
        console.log('');

        return app;
    } catch (error) {
        console.error('❌ Failed to start Vendure Engine:', error);
        process.exit(1);
    }
}

startServer();
