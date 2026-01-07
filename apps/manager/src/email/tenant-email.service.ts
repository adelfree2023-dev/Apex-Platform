import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { EmailType } from '@prisma/client';

@Injectable()
export class TenantEmailService {
    private readonly logger = new Logger(TenantEmailService.name);

    // Cache transporters by tenantId to avoid recreating
    private transporterCache = new Map<string, nodemailer.Transporter>();

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Send email using tenant-specific settings
     */
    async sendEmail(
        tenantId: string,
        type: EmailType,
        toEmail: string,
        data: Record<string, any>,
    ): Promise<{ success: boolean; messageId?: string }> {
        // 1. Get tenant email settings
        const settings = await this.getSettings(tenantId);
        if (!settings) {
            throw new NotFoundException(`Email settings not found for tenant ${tenantId}`);
        }

        // 2. Check if email domain is blocked
        if (settings.blockTempEmails) {
            const isBlocked = await this.isEmailBlocked(toEmail, tenantId);
            if (isBlocked) {
                throw new BadRequestException('This email domain is not allowed. Please use a different email address.');
            }
        }

        // 3. Get email template
        const template = await this.getTemplate(tenantId, type);
        if (!template) {
            this.logger.warn(`No template found for ${type} in tenant ${tenantId}, using default`);
            // Use a basic fallback template
        }

        // 4. Compile and render template
        const subject = template ? this.renderTemplate(template.subject, data) : this.getDefaultSubject(type);
        const html = template ? this.renderTemplate(template.bodyHtml, data) : this.getDefaultHtml(type, data);

        // 5. Get or create transporter
        const transporter = await this.getTransporter(settings);

        // 6. Send email
        try {
            const result = await transporter.sendMail({
                from: `"${settings.fromName}" <${settings.fromEmail || settings.smtpUser}>`,
                to: toEmail,
                subject,
                html,
                replyTo: settings.replyToEmail || undefined,
            });

            // 7. Log success
            await this.logEmail(tenantId, type, toEmail, subject, 'sent');
            this.logger.log(`📧 Email [${type}] sent to ${toEmail} for tenant ${tenantId}`);

            return { success: true, messageId: result.messageId };
        } catch (error) {
            // Log failure
            await this.logEmail(tenantId, type, toEmail, subject, 'failed', error.message);
            this.logger.error(`❌ Failed to send email [${type}] to ${toEmail}:`, error);
            throw error;
        }
    }

    /**
     * Resolve tenant slug or ID to actual tenant ID
     */
    private async resolveTenantId(slugOrId: string): Promise<string> {
        // First try to find by slug
        const tenant = await this.prisma.tenant.findFirst({
            where: {
                OR: [
                    { slug: slugOrId },
                    { id: slugOrId },
                ],
            },
            select: { id: true },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant not found: ${slugOrId}`);
        }

        return tenant.id;
    }

    /**
     * Get tenant email settings
     */
    async getSettings(slugOrId: string) {
        const tenantId = await this.resolveTenantId(slugOrId);
        return this.prisma.tenantEmailSettings.findUnique({
            where: { tenantId },
        });
    }

    /**
     * Create or update tenant email settings
     */
    async upsertSettings(slugOrId: string, data: {
        smtpHost?: string;
        smtpPort?: number;
        smtpUser?: string;
        smtpPass?: string;
        smtpSecure?: boolean;
        fromName?: string;
        fromEmail?: string;
        replyToEmail?: string;
        requireEmailVerification?: boolean;
        blockTempEmails?: boolean;
    }) {
        const tenantId = await this.resolveTenantId(slugOrId);

        // Clear transporter cache for this tenant
        this.transporterCache.delete(tenantId);

        return this.prisma.tenantEmailSettings.upsert({
            where: { tenantId },
            update: data,
            create: {
                tenantId,
                ...data,
            },
        });
    }

    /**
     * Test SMTP connection
     */
    async testConnection(tenantId: string): Promise<{ success: boolean; message: string }> {
        const settings = await this.getSettings(tenantId);
        if (!settings) {
            throw new NotFoundException('Email settings not found');
        }

        try {
            const transporter = this.createTransporter(settings);
            await transporter.verify();
            return { success: true, message: 'SMTP connection successful' };
        } catch (error) {
            return { success: false, message: `SMTP connection failed: ${error.message}` };
        }
    }

    /**
     * Send test email
     */
    async sendTestEmail(tenantId: string, toEmail: string): Promise<{ success: boolean }> {
        return this.sendEmail(tenantId, 'WELCOME' as EmailType, toEmail, {
            firstName: 'Test',
            lastName: 'User',
        });
    }

    /**
     * Get email template
     */
    async getTemplate(tenantId: string, type: EmailType) {
        return this.prisma.emailTemplate.findUnique({
            where: {
                tenantId_type: { tenantId, type },
            },
        });
    }

    /**
     * Get all templates for tenant
     */
    async getAllTemplates(tenantId: string) {
        return this.prisma.emailTemplate.findMany({
            where: { tenantId },
        });
    }

    /**
     * Create or update email template
     */
    async upsertTemplate(tenantId: string, type: EmailType, data: {
        subject: string;
        bodyHtml: string;
        bodyText?: string;
        isActive?: boolean;
    }) {
        return this.prisma.emailTemplate.upsert({
            where: {
                tenantId_type: { tenantId, type },
            },
            update: data,
            create: {
                tenantId,
                type,
                ...data,
            },
        });
    }

    /**
     * Check if email domain is blocked
     */
    private async isEmailBlocked(email: string, tenantId: string): Promise<boolean> {
        const domain = email.split('@')[1]?.toLowerCase();
        if (!domain) return false;

        const blocked = await this.prisma.blockedEmailDomain.findFirst({
            where: {
                domain,
                OR: [
                    { isGlobal: true },
                    { tenantId },
                ],
            },
        });

        return !!blocked;
    }

    /**
     * Get cached transporter or create new
     */
    private async getTransporter(settings: any): Promise<nodemailer.Transporter> {
        const cached = this.transporterCache.get(settings.tenantId);
        if (cached) return cached;

        const transporter = this.createTransporter(settings);
        this.transporterCache.set(settings.tenantId, transporter);
        return transporter;
    }

    /**
     * Create nodemailer transporter
     */
    private createTransporter(settings: any): nodemailer.Transporter {
        return nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: settings.smtpSecure,
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
            },
        });
    }

    /**
     * Render template with Handlebars
     */
    private renderTemplate(template: string, data: Record<string, any>): string {
        const compiled = Handlebars.compile(template);
        return compiled(data);
    }

    /**
     * Log email to database
     */
    private async logEmail(
        tenantId: string,
        type: EmailType,
        toEmail: string,
        subject: string,
        status: string,
        errorMsg?: string,
    ) {
        await this.prisma.emailLog.create({
            data: {
                tenantId,
                type,
                toEmail,
                subject,
                status,
                errorMsg,
            },
        });
    }

    /**
     * Default subjects for email types
     */
    private getDefaultSubject(type: EmailType): string {
        const subjects: Record<EmailType, string> = {
            VERIFICATION: 'Verify your email address',
            WELCOME: 'Welcome to our store!',
            PASSWORD_RESET: 'Reset your password',
            ORDER_CONFIRMATION: 'Order Confirmation',
            ORDER_SHIPPED: 'Your order has shipped',
            ORDER_CANCELLED: 'Order Cancelled',
        };
        return subjects[type] || 'Notification';
    }

    /**
     * Default HTML for email types
     */
    private getDefaultHtml(type: EmailType, data: Record<string, any>): string {
        const templates: Record<EmailType, string> = {
            VERIFICATION: `<h1>Welcome!</h1><p>Please verify your email by clicking: <a href="{{verificationUrl}}">Verify</a></p>`,
            WELCOME: `<h1>Welcome, {{firstName}}!</h1><p>Thank you for joining us.</p>`,
            PASSWORD_RESET: `<h1>Password Reset</h1><p>Click here to reset: <a href="{{resetUrl}}">Reset Password</a></p>`,
            ORDER_CONFIRMATION: `<h1>Order Confirmed</h1><p>Your order #{{orderNumber}} has been confirmed.</p>`,
            ORDER_SHIPPED: `<h1>Order Shipped</h1><p>Your order #{{orderNumber}} is on its way!</p>`,
            ORDER_CANCELLED: `<h1>Order Cancelled</h1><p>Your order #{{orderNumber}} has been cancelled.</p>`,
        };
        return this.renderTemplate(templates[type] || '<p>{{message}}</p>', data);
    }
}
