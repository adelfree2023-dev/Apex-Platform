import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VendureModule } from './vendure/vendure.module';
import { TenantsModule } from './tenants/tenants.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        // Global configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Core modules
        PrismaModule,
        HealthModule,

        // Feature modules
        VendureModule,
        TenantsModule,
    ],
})
export class AppModule { }
