import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS
    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log('');
    logger.log('═══════════════════════════════════════════════');
    logger.log('🎉 MANAGER API STARTED SUCCESSFULLY!');
    logger.log('═══════════════════════════════════════════════');
    logger.log(`📡 API:        http://localhost:${port}/api`);
    logger.log(`💊 Health:     http://localhost:${port}/api/health`);
    logger.log(`🏢 Tenants:    http://localhost:${port}/api/tenants`);
    logger.log('═══════════════════════════════════════════════');
    logger.log('');
}

bootstrap();
