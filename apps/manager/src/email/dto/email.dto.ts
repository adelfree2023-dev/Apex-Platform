import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { EmailType } from '@prisma/client';

export class UpdateEmailSettingsDto {
    @IsOptional()
    @IsString()
    smtpHost?: string;

    @IsOptional()
    @IsNumber()
    smtpPort?: number;

    @IsOptional()
    @IsString()
    smtpUser?: string;

    @IsOptional()
    @IsString()
    smtpPass?: string;

    @IsOptional()
    @IsBoolean()
    smtpSecure?: boolean;

    @IsOptional()
    @IsString()
    fromName?: string;

    @IsOptional()
    @IsEmail()
    fromEmail?: string;

    @IsOptional()
    @IsEmail()
    replyToEmail?: string;

    @IsOptional()
    @IsBoolean()
    requireEmailVerification?: boolean;

    @IsOptional()
    @IsBoolean()
    blockTempEmails?: boolean;
}

export class UpdateEmailTemplateDto {
    @IsString()
    subject: string;

    @IsString()
    bodyHtml: string;

    @IsOptional()
    @IsString()
    bodyText?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class SendTestEmailDto {
    @IsEmail()
    toEmail: string;
}

export class SendTenantEmailDto {
    @IsString()
    tenantId: string;

    @IsEnum(EmailType)
    type: EmailType;

    @IsEmail()
    toEmail: string;

    @IsOptional()
    data?: Record<string, any>;
}
