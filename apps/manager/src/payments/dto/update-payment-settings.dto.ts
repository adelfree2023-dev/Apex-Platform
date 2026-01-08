import { IsBoolean, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdatePaymentSettingsDto {
    // ============ Card Payments ============
    @IsOptional()
    @IsBoolean()
    cardEnabled?: boolean;

    @IsOptional()
    @IsString()
    cardProvider?: string; // "stripe", "paymob", "fawry_cards"

    @IsOptional()
    @IsString()
    cardApiKey?: string;

    @IsOptional()
    @IsString()
    cardSecretKey?: string;

    @IsOptional()
    @IsString()
    cardWebhookSecret?: string;

    // ============ InstaPay ============
    @IsOptional()
    @IsBoolean()
    instapayEnabled?: boolean;

    @IsOptional()
    @IsString()
    instapayAccount?: string;

    @IsOptional()
    @IsString()
    instapayApiKey?: string;

    // ============ E-Wallets ============
    @IsOptional()
    @IsBoolean()
    vodafoneCashEnabled?: boolean;

    @IsOptional()
    @IsString()
    vodafoneCashNumber?: string;

    @IsOptional()
    @IsBoolean()
    orangeCashEnabled?: boolean;

    @IsOptional()
    @IsString()
    orangeCashNumber?: string;

    @IsOptional()
    @IsBoolean()
    etisalatCashEnabled?: boolean;

    @IsOptional()
    @IsString()
    etisalatCashNumber?: string;

    // ============ Fawry ============
    @IsOptional()
    @IsBoolean()
    fawryEnabled?: boolean;

    @IsOptional()
    @IsString()
    fawryMerchantId?: string;

    @IsOptional()
    @IsString()
    fawrySecretKey?: string;

    // ============ Bank Transfer ============
    @IsOptional()
    @IsBoolean()
    bankTransferEnabled?: boolean;

    @IsOptional()
    @IsString()
    bankName?: string;

    @IsOptional()
    @IsString()
    bankAccountName?: string;

    @IsOptional()
    @IsString()
    bankAccountNumber?: string;

    @IsOptional()
    @IsString()
    bankIban?: string;

    // ============ Cash on Delivery ============
    @IsOptional()
    @IsBoolean()
    codEnabled?: boolean;

    @IsOptional()
    @IsInt()
    @Min(0)
    codExtraFee?: number;

    // ============ General ============
    @IsOptional()
    @IsString()
    defaultCurrency?: string;

    @IsOptional()
    @IsBoolean()
    testMode?: boolean;
}
