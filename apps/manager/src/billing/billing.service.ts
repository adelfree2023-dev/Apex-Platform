import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(
        private prisma: PrismaService,
        private stripeService: StripeService,
        private configService: ConfigService,
    ) { }

    /**
     * Get price ID for a plan from environment
     */
    private getPriceIdForPlan(plan: PlanType): string {
        const priceMap: Record<PlanType, string> = {
            BASIC: this.configService.get('STRIPE_PLAN_BASIC', ''),
            PRO: this.configService.get('STRIPE_PLAN_PRO', ''),
            ENTERPRISE: this.configService.get('STRIPE_PLAN_ENTERPRISE', ''),
        };

        const priceId = priceMap[plan];
        if (!priceId) {
            throw new Error(`Price ID not configured for plan: ${plan}`);
        }
        return priceId;
    }

    /**
     * Create subscription for a tenant
     */
    async createSubscription(tenantId: string, plan: PlanType) {
        // Get tenant
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        if (tenant.subscription) {
            throw new ConflictException('Tenant already has a subscription');
        }

        // Check if Stripe is configured
        if (!this.stripeService.isConfigured()) {
            // Create local subscription without Stripe
            const subscription = await this.prisma.subscription.create({
                data: {
                    tenantId,
                    plan,
                    status: 'TRIALING',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
                },
            });

            // Activate tenant
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { status: 'TRIAL' },
            });

            return { subscription, clientSecret: null };
        }

        // Get plan price ID
        const priceId = this.getPriceIdForPlan(plan);

        // Create Stripe customer
        const customer = await this.stripeService.createCustomer(
            `${tenant.slug}@apex.com`,
            tenant.name,
            { tenantId }
        );

        if (!customer) {
            throw new Error('Failed to create Stripe customer');
        }

        // Create subscription in Stripe
        const stripeSubscription = await this.stripeService.createSubscription(
            customer.id,
            priceId,
            { tenantId }
        );

        if (!stripeSubscription) {
            throw new Error('Failed to create Stripe subscription');
        }

        // Save subscription in database
        const subscription = await this.prisma.subscription.create({
            data: {
                tenantId,
                stripeSubscriptionId: stripeSubscription.id,
                stripePriceId: priceId,
                stripeCustomerId: customer.id,
                plan,
                status: 'TRIALING',
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
            },
        });

        // Update tenant status
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { status: 'TRIAL' },
        });

        // Return client secret for 3D Secure
        const invoice = stripeSubscription.latest_invoice as any;
        const clientSecret = invoice?.payment_intent?.client_secret || null;

        this.logger.log(`✅ Subscription created for tenant ${tenantId}`);

        return { subscription, clientSecret };
    }

    /**
     * Update subscription plan (upgrade/downgrade)
     */
    async updatePlan(tenantId: string, newPlan: PlanType) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true },
        });

        if (!tenant || !tenant.subscription) {
            throw new NotFoundException('Subscription not found');
        }

        const newPriceId = this.getPriceIdForPlan(newPlan);

        // Update in Stripe if configured
        if (tenant.subscription.stripeSubscriptionId && this.stripeService.isConfigured()) {
            await this.stripeService.updateSubscription(
                tenant.subscription.stripeSubscriptionId,
                newPriceId
            );
        }

        // Update in database
        await this.prisma.subscription.update({
            where: { id: tenant.subscription.id },
            data: {
                plan: newPlan,
                stripePriceId: newPriceId,
            },
        });

        this.logger.log(`✅ Plan updated for tenant ${tenantId} to ${newPlan}`);

        return { message: 'Plan updated successfully', newPlan };
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(tenantId: string, immediate: boolean = false) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { subscription: true },
        });

        if (!tenant || !tenant.subscription) {
            throw new NotFoundException('Subscription not found');
        }

        // Cancel in Stripe if configured
        if (tenant.subscription.stripeSubscriptionId && this.stripeService.isConfigured()) {
            await this.stripeService.cancelSubscription(
                tenant.subscription.stripeSubscriptionId,
                !immediate // cancelAtPeriodEnd
            );
        }

        // Update in database
        if (immediate) {
            await this.prisma.subscription.update({
                where: { id: tenant.subscription.id },
                data: {
                    status: 'CANCELED',
                    canceledAt: new Date(),
                },
            });

            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { status: 'CANCELLED' },
            });
        } else {
            await this.prisma.subscription.update({
                where: { id: tenant.subscription.id },
                data: {
                    cancelAt: tenant.subscription.currentPeriodEnd,
                },
            });
        }

        this.logger.log(`🚫 Subscription canceled for tenant ${tenantId}`);

        return {
            message: immediate
                ? 'Subscription canceled immediately'
                : 'Subscription will cancel at period end'
        };
    }

    /**
     * Get subscription details
     */
    async getSubscription(tenantId: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId },
            include: { tenant: { select: { name: true, slug: true } } },
        });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        return subscription;
    }

    /**
     * Get payment history
     */
    async getPaymentHistory(tenantId: string) {
        return this.prisma.payment.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    /**
     * Create customer portal session
     */
    async createPortalSession(tenantId: string, returnUrl: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { tenantId },
        });

        if (!subscription?.stripeCustomerId) {
            throw new NotFoundException('No Stripe customer found');
        }

        const session = await this.stripeService.createPortalSession(
            subscription.stripeCustomerId,
            returnUrl
        );

        if (!session) {
            throw new Error('Failed to create portal session');
        }

        return { url: session.url };
    }
}
