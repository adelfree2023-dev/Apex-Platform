import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
    private logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) { }

    /**
     * Send verification email
     */
    async sendVerificationEmail(email: string, token: string) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3002';
        const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

        // For now, just log (Phase 11 will implement real email with SMTP)
        this.logger.log(`
      📧 ==== VERIFICATION EMAIL ====
      To: ${email}
      Link: ${verifyUrl}
      ==============================
    `);

        // For development, we'll return the token so it can be used
        return { verifyUrl, token };
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email: string, token: string) {
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3002';
        const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

        this.logger.log(`
      📧 ==== PASSWORD RESET EMAIL ====
      To: ${email}
      Link: ${resetUrl}
      =================================
    `);

        return { resetUrl, token };
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email: string, name: string) {
        this.logger.log(`
      📧 ==== WELCOME EMAIL ====
      To: ${email}
      Name: ${name}
      ===========================
    `);

        return { sent: true };
    }
}
