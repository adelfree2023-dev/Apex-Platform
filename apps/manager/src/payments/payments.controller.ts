import {
    Controller,
    Get,
    Patch,
    Post,
    Body,
    Param,
    Logger
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';

@Controller('payments')
export class PaymentsController {
    private readonly logger = new Logger(PaymentsController.name);

    constructor(private paymentsService: PaymentsService) { }

    /**
     * Get payment settings for a tenant
     * GET /payments/settings/:tenantId
     */
    @Get('settings/:tenantId')
    async getPaymentSettings(@Param('tenantId') tenantId: string) {
        return this.paymentsService.getPaymentSettings(tenantId);
    }

    /**
     * Update payment settings for a tenant
     * PATCH /payments/settings/:tenantId
     */
    @Patch('settings/:tenantId')
    async updatePaymentSettings(
        @Param('tenantId') tenantId: string,
        @Body() dto: UpdatePaymentSettingsDto
    ) {
        return this.paymentsService.updatePaymentSettings(tenantId, dto);
    }

    /**
     * Get enabled payment methods for a tenant (Storefront API)
     * GET /payments/methods/:tenantId
     */
    @Get('methods/:tenantId')
    async getEnabledMethods(@Param('tenantId') tenantId: string) {
        return this.paymentsService.getEnabledMethods(tenantId);
    }

    /**
     * Toggle a payment method
     * POST /payments/methods/:tenantId/toggle
     */
    @Post('methods/:tenantId/toggle')
    async toggleMethod(
        @Param('tenantId') tenantId: string,
        @Body() body: { method: string; enabled: boolean }
    ) {
        return this.paymentsService.toggleMethod(tenantId, body.method, body.enabled);
    }
}
