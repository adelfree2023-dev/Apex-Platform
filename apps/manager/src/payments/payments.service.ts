import {
    Injectable,
    NotFoundException,
    Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get payment settings for a tenant
     */
    async getPaymentSettings(tenantId: string) {
        // Get or create payment settings
        let settings = await this.prisma.tenantPaymentSettings.findUnique({
            where: { tenantId },
        });

        if (!settings) {
            // Create default settings
            settings = await this.prisma.tenantPaymentSettings.create({
                data: {
                    tenantId,
                    codEnabled: true, // COD enabled by default
                },
            });
        }

        return settings;
    }

    /**
     * Update payment settings for a tenant
     */
    async updatePaymentSettings(tenantId: string, dto: UpdatePaymentSettingsDto) {
        // Ensure tenant exists
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        // Upsert payment settings
        const settings = await this.prisma.tenantPaymentSettings.upsert({
            where: { tenantId },
            update: { ...dto },
            create: {
                tenantId,
                ...dto,
            },
        });

        this.logger.log(`✅ Payment settings updated for tenant ${tenantId}`);

        return settings;
    }

    /**
     * Get enabled payment methods for a tenant
     */
    async getEnabledMethods(tenantId: string) {
        const settings = await this.getPaymentSettings(tenantId);

        const methods = [];

        if (settings.cardEnabled) {
            methods.push({
                type: 'VISA_MASTERCARD',
                provider: settings.cardProvider,
                enabled: true,
            });
        }

        if (settings.instapayEnabled) {
            methods.push({
                type: 'INSTAPAY',
                account: settings.instapayAccount,
                enabled: true,
            });
        }

        if (settings.vodafoneCashEnabled) {
            methods.push({
                type: 'VODAFONE_CASH',
                number: settings.vodafoneCashNumber,
                enabled: true,
            });
        }

        if (settings.orangeCashEnabled) {
            methods.push({
                type: 'ORANGE_CASH',
                number: settings.orangeCashNumber,
                enabled: true,
            });
        }

        if (settings.etisalatCashEnabled) {
            methods.push({
                type: 'ETISALAT_CASH',
                number: settings.etisalatCashNumber,
                enabled: true,
            });
        }

        if (settings.fawryEnabled) {
            methods.push({
                type: 'FAWRY',
                enabled: true,
            });
        }

        if (settings.bankTransferEnabled) {
            methods.push({
                type: 'BANK_TRANSFER',
                bankName: settings.bankName,
                accountName: settings.bankAccountName,
                enabled: true,
            });
        }

        if (settings.codEnabled) {
            methods.push({
                type: 'CASH_ON_DELIVERY',
                extraFee: settings.codExtraFee,
                enabled: true,
            });
        }

        return {
            tenantId,
            currency: settings.defaultCurrency,
            testMode: settings.testMode,
            methods,
        };
    }

    /**
     * Toggle a payment method
     */
    async toggleMethod(tenantId: string, method: string, enabled: boolean) {
        const fieldMap: Record<string, string> = {
            VISA_MASTERCARD: 'cardEnabled',
            INSTAPAY: 'instapayEnabled',
            VODAFONE_CASH: 'vodafoneCashEnabled',
            ORANGE_CASH: 'orangeCashEnabled',
            ETISALAT_CASH: 'etisalatCashEnabled',
            FAWRY: 'fawryEnabled',
            BANK_TRANSFER: 'bankTransferEnabled',
            CASH_ON_DELIVERY: 'codEnabled',
        };

        const field = fieldMap[method];
        if (!field) {
            throw new NotFoundException('Invalid payment method');
        }

        return this.prisma.tenantPaymentSettings.upsert({
            where: { tenantId },
            update: { [field]: enabled },
            create: { tenantId, [field]: enabled },
        });
    }
}
