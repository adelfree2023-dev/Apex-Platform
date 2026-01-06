import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { VendureModule } from './vendure/vendure.module';
import { TenantsModule } from './tenants/tenants.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        // Global configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Rate limiting (protection against brute force)
        ThrottlerModule.forRoot([{
            ttl: 60000,    // Time window: 60 seconds
            limit: 10,     // Max 10 requests per minute per IP
        }]),

        // Core modules
        PrismaModule,
        HealthModule,

        // Feature modules
        VendureModule,
        TenantsModule,
        AuthModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }

