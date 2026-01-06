import { Controller, Post, Body, Get, Query, Req, UseGuards, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, RefreshTokenDto } from './dto/auth.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /auth/register
     * Register a new user
     */
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    /**
     * GET /auth/verify-email?token=xxx
     * Verify email with token
     */
    @Get('verify-email')
    async verifyEmail(@Query() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.token);
    }

    /**
     * POST /auth/login
     * Login user and get tokens
     */
    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Req() req: Request,
        @Headers('user-agent') userAgent?: string,
    ) {
        const ipAddress = req.ip || req.socket.remoteAddress;
        return this.authService.login(dto, ipAddress, userAgent);
    }

    /**
     * POST /auth/logout
     * Logout user and invalidate session
     */
    @Post('logout')
    async logout(@Headers('authorization') authorization: string) {
        const token = authorization?.replace('Bearer ', '');
        return this.authService.logout(token);
    }

    /**
     * POST /auth/refresh
     * Refresh access token
     */
    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto);
    }

    /**
     * POST /auth/forgot-password
     * Request password reset email
     */
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    /**
     * POST /auth/reset-password
     * Reset password with token
     */
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }
}
