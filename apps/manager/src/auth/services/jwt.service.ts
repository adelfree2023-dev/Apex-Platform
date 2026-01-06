import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
    sub: string; // user id
    email: string;
    role: string;
    tenantId?: string; // Optional: if user belongs to specific tenant
}

@Injectable()
export class JwtAuthService {
    constructor(
        private jwtService: NestJwtService,
        private configService: ConfigService,
    ) { }

    /**
     * Generate access token (short-lived)
     */
    generateAccessToken(payload: JwtPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET') || 'super-secret-jwt-key',
            expiresIn: '15m', // 15 minutes
        });
    }

    /**
     * Generate refresh token (long-lived)
     */
    generateRefreshToken(payload: JwtPayload): string {
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') || 'super-secret-refresh-key',
            expiresIn: '7d', // 7 days
        });
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token: string): JwtPayload {
        return this.jwtService.verify(token, {
            secret: this.configService.get('JWT_SECRET') || 'super-secret-jwt-key',
        });
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token: string): JwtPayload {
        return this.jwtService.verify(token, {
            secret: this.configService.get('JWT_REFRESH_SECRET') || 'super-secret-refresh-key',
        });
    }

    /**
     * Calculate token expiry date
     */
    getAccessTokenExpiry(): Date {
        return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    getRefreshTokenExpiry(): Date {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
}
