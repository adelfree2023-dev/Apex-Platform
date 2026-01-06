import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { JwtAuthService } from './services/jwt.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET') || 'super-secret-jwt-key',
                signOptions: { expiresIn: '15m' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        PasswordService,
        JwtAuthService,
        EmailService,
        PrismaService,
    ],
    exports: [AuthService, PasswordService, JwtAuthService],
})
export class AuthModule { }
