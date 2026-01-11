import {
    Controller,
    Post,
    Req,
    Res,
    Headers,
    Logger,
    RawBodyRequest
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { UseGuards, Body, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/stripe.dto';

@Controller('stripe')
export class StripeController {
    private readonly logger = new Logger(StripeController.name);

    constructor(
        private stripeService: StripeService,
        private prisma: PrismaService,
    ) { }

    /**
     * Create Checkout Session
     * POST /stripe/checkout-session
     */
    @UseGuards(JwtAuthGuard)
    @Post('checkout-session')
    async createCheckoutSession(
        @Req() req: any,
        @Body() dto: CreateCheckoutSessionDto,
    ) {
        const userId = req.user.userId;

        // 1. Get Tenant for User
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true },
        });

        if (!user || !user.tenant) {
            throw new BadRequestException('User or Tenant not found');
        }

        const customerId = user.tenant.stripeCustomerId;
        if (!customerId) {
            throw new BadRequestException('Tenant has no Stripe Customer ID');
        }

        // 2. Create Session
        const session = await this.stripeService.createCheckoutSession(
            customerId,
            dto.priceId,
            dto.successUrl || 'http://localhost:3002/billing?success=true',
            dto.cancelUrl || 'http://localhost:3002/billing?canceled=true',
        );

        if (!session) {
            throw new BadRequestException('Stripe not configured or failed to create session');
        }

        return { url: session.url };
    }

    /**
     * Stripe Webhook Handler
     * POST /stripe/webhook
     */
    @Post('webhook')
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
        @Headers('stripe-signature') signature: string,
    ) {
        let event: Stripe.Event | null;

        try {
            // Verify webhook signature
            event = this.stripeService.constructWebhookEvent(
                req.rawBody!,
                signature
            );

            if (!event) {
                this.logger.error('Failed to construct webhook event');
                return res.status(400).send('Webhook Error: Failed to construct event');
            }
        } catch (err: any) {
            this.logger.error('⚠️ Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // 🔒 LOCK-FIRST PATTERN: Atomic Insert
        // We attempt to create the record with status 'PENDING'.
        // If it exists (Unique Constraint on eventId), this throws and we abort.
        try {
            await this.prisma.processedWebhookEvent.create({
                data: {
                    eventId: event.id,
                    eventType: event.type,
                    provider: 'stripe',
                    status: 'PENDING',
                    data: event.data.object as any,
                },
            });
        } catch (error) {
            // If error is Unique Constraint Violation, it means we are already processing it.
            this.logger.warn(`🔒 Event ${event.id} locked/processed by another worker. Skipping.`);
            return res.json({ received: true });
        }

        this.logger.log(`2️⃣ Acquired Lock for ${event.type} (${event.id}). Processing...`);

        try {
            // Process event
            await this.processWebhookEvent(event);

            // ✅ Update to COMPLETED
            await this.prisma.processedWebhookEvent.update({
                where: { eventId: event.id },
                data: { status: 'COMPLETED' },
            });

            this.logger.log(`✅ Event ${event.id} processed successfully`);
            return res.json({ received: true });
        } catch (error: any) {
            this.logger.error(`❌ Error processing webhook:`, error);

            // 🟥 Mark as FAILED so it can be debugged or retried manually
            await this.prisma.processedWebhookEvent.update({
                where: { eventId: event.id },
                data: { status: 'FAILED', data: { error: error.message, ...event.data.object as any } },
            });

            // Return 500 so Stripe retries
            return res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

    /**
     * Process webhook event based on type
     */
    private async processWebhookEvent(event: Stripe.Event) {
        const metadata = (event.data.object as any).metadata;
        const tenantId = metadata?.tenantId;

        switch (event.type) {
            // ========== SUBSCRIPTION EVENTS ==========

            case 'customer.subscription.created':
                this.logger.log(`📌 Subscription created: ${(event.data.object as Stripe.Subscription).id}`);
                break;

            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            // ========== PAYMENT EVENTS ==========

            case 'invoice.payment_succeeded':
                await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;

            case 'invoice.payment_failed':
                await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;

            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            // ========== CUSTOMER EVENTS ==========

            case 'customer.deleted':
                await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
                break;

            default:
                this.logger.log(`ℹ️ Unhandled event type: ${event.type}`);
        }
    }

    /**
     * Handle subscription updated
     */
    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const dbSubscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
            include: { tenant: true },
        });

        if (!dbSubscription) {
            this.logger.warn(`Subscription not found: ${subscription.id}`);
            return;
        }

        // Update subscription data
        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                status: this.mapStripeStatus(subscription.status),
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
            },
        });

        this.logger.log(`✅ Subscription ${subscription.id} updated`);
    }

    /**
     * Handle subscription deleted
     */
    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const dbSubscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
            include: { tenant: true },
        });

        if (!dbSubscription) {
            this.logger.warn(`Subscription not found: ${subscription.id}`);
            return;
        }

        // Update subscription status
        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                status: 'CANCELED',
                canceledAt: new Date(),
            },
        });

        // Suspend the tenant license
        await this.prisma.license.updateMany({
            where: { tenantId: dbSubscription.tenantId },
            data: { status: 'EXPIRED' },
        });

        await this.prisma.tenant.update({
            where: { id: dbSubscription.tenantId },
            data: { status: 'SUSPENDED' },
        });

        this.logger.log(`🚫 Subscription ${subscription.id} deleted, tenant suspended`);
    }

    /**
     * Handle successful payment (invoice)
     */
    private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
        const dbSubscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
            include: { tenant: true },
        });

        if (!dbSubscription) return;

        this.logger.log(`✅ Payment succeeded for tenant: ${dbSubscription.tenantId}`);

        // Reactivate if suspended
        if (dbSubscription.tenant.status === 'SUSPENDED') {
            await this.prisma.tenant.update({
                where: { id: dbSubscription.tenantId },
                data: { status: 'ACTIVE' },
            });

            await this.prisma.license.updateMany({
                where: { tenantId: dbSubscription.tenantId },
                data: { status: 'ACTIVE' },
            });
        }

        // Record payment
        await this.prisma.payment.create({
            data: {
                tenantId: dbSubscription.tenantId,
                amount: invoice.amount_paid,
                currency: invoice.currency.toUpperCase(),
                status: 'SUCCEEDED',
                externalPaymentId: invoice.payment_intent as string,
                externalInvoiceId: invoice.id,
                paidAt: new Date(),
                metadata: {
                    type: 'subscription',
                    periodStart: invoice.period_start,
                    periodEnd: invoice.period_end,
                },
            },
        });
    }

    /**
     * Handle failed payment
     */
    private async handlePaymentFailed(invoice: Stripe.Invoice) {
        const dbSubscription = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: invoice.subscription as string },
            include: { tenant: true },
        });

        if (!dbSubscription) return;

        this.logger.log(`❌ Payment failed for tenant: ${dbSubscription.tenantId}`);

        // Update subscription status
        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: { status: 'PAST_DUE' },
        });

        // Suspend after 3 failed attempts
        if (invoice.attempt_count >= 3) {
            await this.prisma.tenant.update({
                where: { id: dbSubscription.tenantId },
                data: { status: 'SUSPENDED' },
            });

            await this.prisma.license.updateMany({
                where: { tenantId: dbSubscription.tenantId },
                data: { status: 'EXPIRED' },
            });

            this.logger.log(`🚫 Tenant ${dbSubscription.tenantId} suspended after 3 failed payments`);
        }
    }

    /**
     * Handle payment intent succeeded (for customer one-time payments)
     */
    private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
        const tenantId = paymentIntent.metadata?.tenantId;
        const orderId = paymentIntent.metadata?.orderId;

        if (!tenantId) return;

        // Update or create payment record
        await this.prisma.payment.upsert({
            where: { externalPaymentId: paymentIntent.id },
            update: {
                status: 'SUCCEEDED',
                paidAt: new Date(),
            },
            create: {
                tenantId,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency.toUpperCase(),
                status: 'SUCCEEDED',
                externalPaymentId: paymentIntent.id,
                orderId,
                paidAt: new Date(),
                metadata: paymentIntent.metadata,
            },
        });

        this.logger.log(`✅ Payment intent ${paymentIntent.id} succeeded`);
    }

    /**
     * Handle customer deleted
     */
    private async handleCustomerDeleted(customer: Stripe.Customer) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { stripeCustomerId: customer.id },
        });

        if (!subscription) return;

        await this.prisma.tenant.update({
            where: { id: subscription.tenantId },
            data: { status: 'CANCELLED' },
        });

        this.logger.log(`🗑️ Customer ${customer.id} deleted`);
    }

    /**
     * Map Stripe status to our enum
     */
    private mapStripeStatus(stripeStatus: string): any {
        const statusMap: Record<string, string> = {
            active: 'ACTIVE',
            past_due: 'PAST_DUE',
            canceled: 'CANCELED',
            trialing: 'TRIALING',
            incomplete: 'INCOMPLETE',
            incomplete_expired: 'CANCELED',
        };

        return statusMap[stripeStatus] || 'ACTIVE';
    }
}
