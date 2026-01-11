import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { VendureModule } from './vendure/vendure.module';
import { TenantsModule } from './tenants/tenants.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { StripeModule } from './stripe/stripe.module';
import { BillingModule } from './billing/billing.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
    imports: [
        // Global configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Rate limiting (Redis Storage)
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: [{
                    ttl: 60000,
                    limit: 10,
                }],
                storage: new ThrottlerStorageRedisService(
                    config.get('REDIS_URL') || 'redis://localhost:6379'
                ),
            }),
        }),

        // Core modules
        PrismaModule,
        HealthModule,

        // Feature modules
        VendureModule,
        TenantsModule,
        AuthModule,
        UsersModule,
        EmailModule,

        // Payment & Billing modules
        StripeModule,
        BillingModule,
        PaymentsModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }


