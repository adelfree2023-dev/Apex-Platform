import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS for all frontend ports including 3003 and Public IP
    app.enableCors({
        origin: [
          'http://localhost:3000', 
          'http://localhost:3001', 
          'http://localhost:3002', 
          'http://localhost:3003',
          'http://34.18.154.179:3000',
          'http://34.18.154.179:3001',
          'http://34.18.154.179:3002',
          'http://34.18.154.179:3003'
        ],
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log('🎉 MANAGER API STARTED SUCCESSFULLY on port ' + port);
}
bootstrap();
