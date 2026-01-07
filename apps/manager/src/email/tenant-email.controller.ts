import {
    Controller,
    Get,
    Put,
    Post,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { TenantEmailService } from './tenant-email.service';
import { UpdateEmailSettingsDto, UpdateEmailTemplateDto, SendTestEmailDto, SendTenantEmailDto } from './dto/email.dto';
import { EmailType } from '@prisma/client';

@Controller('tenants/:tenantId/email')
export class TenantEmailController {
    constructor(private readonly emailService: TenantEmailService) { }

    // ============================================
    // EMAIL SETTINGS
    // ============================================

    /**
     * Get tenant email settings
     */
    @Get('settings')
    async getSettings(@Param('tenantId') tenantId: string) {
        const settings = await this.emailService.getSettings(tenantId);
        if (!settings) {
            // Return defaults if no settings exist
            return {
                tenantId,
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpSecure: false,
                fromName: 'My Store',
                requireEmailVerification: false,
                blockTempEmails: true,
            };
        }
        // Don't expose password
        const { smtpPass, ...safe } = settings;
        return { ...safe, smtpPassSet: !!smtpPass };
    }

    /**
     * Update tenant email settings
     */
    @Put('settings')
    async updateSettings(
        @Param('tenantId') tenantId: string,
        @Body() dto: UpdateEmailSettingsDto,
    ) {
        const settings = await this.emailService.upsertSettings(tenantId, dto);
        const { smtpPass, ...safe } = settings;
        return { ...safe, smtpPassSet: !!smtpPass };
    }

    /**
     * Test SMTP connection
     */
    @Post('settings/test-connection')
    async testConnection(@Param('tenantId') tenantId: string) {
        return this.emailService.testConnection(tenantId);
    }

    /**
     * Send test email
     */
    @Post('settings/send-test')
    async sendTestEmail(
        @Param('tenantId') tenantId: string,
        @Body() dto: SendTestEmailDto,
    ) {
        return this.emailService.sendTestEmail(tenantId, dto.toEmail);
    }

    // ============================================
    // EMAIL TEMPLATES
    // ============================================

    /**
     * Get all templates for tenant
     */
    @Get('templates')
    async getTemplates(@Param('tenantId') tenantId: string) {
        const templates = await this.emailService.getAllTemplates(tenantId);

        // Return all types with their status
        const allTypes = Object.values(EmailType);
        return allTypes.map(type => {
            const existing = templates.find(t => t.type === type);
            return existing || {
                type,
                tenantId,
                subject: '',
                bodyHtml: '',
                isActive: false,
                isDefault: true,
            };
        });
    }

    /**
     * Get specific template
     */
    @Get('templates/:type')
    async getTemplate(
        @Param('tenantId') tenantId: string,
        @Param('type') type: EmailType,
    ) {
        const template = await this.emailService.getTemplate(tenantId, type);
        return template || {
            type,
            tenantId,
            subject: '',
            bodyHtml: '',
            isActive: false,
            isDefault: true,
        };
    }

    /**
     * Update template
     */
    @Put('templates/:type')
    async updateTemplate(
        @Param('tenantId') tenantId: string,
        @Param('type') type: EmailType,
        @Body() dto: UpdateEmailTemplateDto,
    ) {
        return this.emailService.upsertTemplate(tenantId, type, dto);
    }
}

// ============================================
// INTERNAL CONTROLLER (for Vendure integration)
// ============================================

@Controller('internal')
export class InternalEmailController {
    constructor(private readonly emailService: TenantEmailService) { }

    /**
     * Send email (called by Vendure or other services)
     */
    @Post('send-email')
    async sendEmail(@Body() dto: SendTenantEmailDto) {
        return this.emailService.sendEmail(
            dto.tenantId,
            dto.type,
            dto.toEmail,
            dto.data || {},
        );
    }
}
