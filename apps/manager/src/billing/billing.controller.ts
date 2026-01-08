import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Logger
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Controller('billing')
export class BillingController {
    private readonly logger = new Logger(BillingController.name);

    constructor(private billingService: BillingService) { }

    /**
     * Create subscription for a tenant
     * POST /billing/subscriptions
     */
    @Post('subscriptions')
    async createSubscription(@Body() dto: CreateSubscriptionDto) {
        return this.billingService.createSubscription(dto.tenantId, dto.plan);
    }

    /**
     * Get subscription details
     * GET /billing/subscriptions/:tenantId
     */
    @Get('subscriptions/:tenantId')
    async getSubscription(@Param('tenantId') tenantId: string) {
        return this.billingService.getSubscription(tenantId);
    }

    /**
     * Update subscription plan
     * PATCH /billing/subscriptions/:tenantId
     */
    @Patch('subscriptions/:tenantId')
    async updatePlan(
        @Param('tenantId') tenantId: string,
        @Body() dto: UpdatePlanDto
    ) {
        return this.billingService.updatePlan(tenantId, dto.plan);
    }

    /**
     * Cancel subscription
     * DELETE /billing/subscriptions/:tenantId
     */
    @Delete('subscriptions/:tenantId')
    async cancelSubscription(
        @Param('tenantId') tenantId: string,
        @Query('immediate') immediate: string
    ) {
        return this.billingService.cancelSubscription(
            tenantId,
            immediate === 'true'
        );
    }

    /**
     * Get payment history
     * GET /billing/payments/:tenantId
     */
    @Get('payments/:tenantId')
    async getPaymentHistory(@Param('tenantId') tenantId: string) {
        return this.billingService.getPaymentHistory(tenantId);
    }

    /**
     * Create customer portal session
     * POST /billing/portal/:tenantId
     */
    @Post('portal/:tenantId')
    async createPortalSession(
        @Param('tenantId') tenantId: string,
        @Body() body: { returnUrl: string }
    ) {
        return this.billingService.createPortalSession(tenantId, body.returnUrl);
    }
}
