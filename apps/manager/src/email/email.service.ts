import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string) {
    const from = this.configService.get('EMAIL_FROM') || '"Apex Platform" <noreply@apex.com>';

    // Check if SMTP is configured
    const host = this.configService.get('SMTP_HOST');
    if (!host) {
      this.logger.warn(`⚠️ SMTP not configured. Simulating email to ${to}:`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Body: ${html}`);
      return; // Early return, success simulation
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`📧 Email sent to ${to}`);
    } catch (error) {
      // Fallback to logging instead of crashing request
      this.logger.error(`❌ Failed to send email to ${to} (Auth/Network Error). Logging content instead:`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Body: ${html}`);
      // throw error; // Don't throw, let the process continue
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://kitvet.com';
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const html = `
            <h1>Welcome to Apex Platform!</h1>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verifyUrl}">Verify Email</a>
            <p>Or copy this link: ${verifyUrl}</p>
        `;

    await this.sendMail(email, 'Verify your email', html);

    return { verifyUrl, token };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://kitvet.com';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const html = `
            <h1>Password Reset Request</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>Or copy this link: ${resetUrl}</p>
        `;

    await this.sendMail(email, 'Reset your password', html);

    return { resetUrl, token };
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string) {
    const html = `
            <h1>Welcome, ${name}!</h1>
            <p>We are excited to have you on board.</p>
        `;

    await this.sendMail(email, 'Welcome to Apex Platform', html);

    return { sent: true };
  }
}
