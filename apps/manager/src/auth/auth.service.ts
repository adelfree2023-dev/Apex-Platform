import { Injectable, Logger, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './services/password.service';
import { JwtAuthService, JwtPayload } from './services/jwt.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from './dto/auth.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtAuthService,
        private readonly emailService: EmailService,
    ) { }

    /**
     * Register a new user
     */
    async register(dto: RegisterDto) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Validate password strength
        const passwordValidation = this.passwordService.validateStrength(dto.password);
        if (!passwordValidation.valid) {
            throw new BadRequestException(passwordValidation.errors.join(', '));
        }

        // Hash password
        const passwordHash = await this.passwordService.hash(dto.password);

        // Generate verification token
        const verificationToken = randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
                verificationToken,
                verificationTokenExpiry,
                emailVerified: false,
                role: 'CUSTOMER',
            },
        });

        // Send verification email
        const emailResult = await this.emailService.sendVerificationEmail(dto.email, verificationToken);

        this.logger.log(`✅ User registered: ${dto.email}`);

        // Return user without sensitive data
        const { passwordHash: _, verificationToken: __, resetToken: ___, ...safeUser } = user;

        return {
            user: safeUser,
            message: 'Registration successful. Please verify your email.',
            verifyUrl: emailResult.verifyUrl, // For development only
        };
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string) {
        const user = await this.prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            throw new NotFoundException('Invalid verification token');
        }

        if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
            throw new BadRequestException('Verification token has expired');
        }

        // Update user
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                isActive: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });

        this.logger.log(`✅ Email verified: ${user.email}`);

        return { message: 'Email verified successfully' };
    }

    /**
     * Login user
     */
    async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        // Check password
        const isPasswordValid = await this.passwordService.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Check if email is verified (optional - can be configured)
        if (!user.emailVerified) {
            throw new UnauthorizedException('Please verify your email before logging in');
        }

        // Generate tokens
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.generateAccessToken(payload);
        const refreshToken = this.jwtService.generateRefreshToken(payload);

        // Create session
        await this.prisma.session.create({
            data: {
                userId: user.id,
                token: accessToken,
                refreshToken,
                expiresAt: this.jwtService.getRefreshTokenExpiry(),
                ipAddress,
                userAgent,
            },
        });

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        this.logger.log(`✅ User logged in: ${user.email}`);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    /**
     * Logout user
     */
    async logout(token: string) {
        const session = await this.prisma.session.findUnique({
            where: { token },
        });

        if (session) {
            await this.prisma.session.delete({
                where: { id: session.id },
            });
            this.logger.log(`✅ User logged out`);
        }

        return { message: 'Logged out successfully' };
    }

    /**
     * Refresh access token
     */
    async refresh(dto: RefreshTokenDto) {
        // Verify refresh token
        let payload: JwtPayload;
        try {
            payload = this.jwtService.verifyRefreshToken(dto.refreshToken);
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Find session
        const session = await this.prisma.session.findUnique({
            where: { refreshToken: dto.refreshToken },
            include: { user: true },
        });

        if (!session) {
            throw new UnauthorizedException('Session not found');
        }

        if (session.expiresAt < new Date()) {
            await this.prisma.session.delete({ where: { id: session.id } });
            throw new UnauthorizedException('Session expired');
        }

        // Generate new tokens
        const newPayload: JwtPayload = {
            sub: session.user.id,
            email: session.user.email,
            role: session.user.role,
        };

        const accessToken = this.jwtService.generateAccessToken(newPayload);
        const refreshToken = this.jwtService.generateRefreshToken(newPayload);

        // Update session
        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                token: accessToken,
                refreshToken,
                expiresAt: this.jwtService.getRefreshTokenExpiry(),
            },
        });

        return { accessToken, refreshToken };
    }

    /**
     * Request password reset
     */
    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        // Don't reveal if user exists or not
        if (!user) {
            return { message: 'If an account exists, you will receive a reset email' };
        }

        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Update user
        await this.prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });

        // Send reset email
        await this.emailService.sendPasswordResetEmail(user.email, resetToken);

        this.logger.log(`📧 Password reset requested for: ${user.email}`);

        return { message: 'If an account exists, you will receive a reset email' };
    }

    /**
     * Reset password
     */
    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { resetToken: dto.token },
        });

        if (!user) {
            throw new NotFoundException('Invalid reset token');
        }

        if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
            throw new BadRequestException('Reset token has expired');
        }

        // Hash new password
        const passwordHash = await this.passwordService.hash(dto.newPassword);

        // Update user and clear reset token
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        // Invalidate all sessions
        await this.prisma.session.deleteMany({
            where: { userId: user.id },
        });

        this.logger.log(`✅ Password reset for: ${user.email}`);

        return { message: 'Password reset successfully' };
    }
}
