import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
      this.logger.log('✅ Stripe initialized successfully');
    } else {
      this.logger.warn('⚠️ STRIPE_SECRET_KEY not configured - Stripe features disabled');
    }
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return this.stripe !== null;
  }

  /**
   * Create Stripe Customer for a tenant
   */
  async createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<Stripe.Customer | null> {
    if (!this.stripe) return null;

    return this.stripe.customers.create({
      email,
      name,
      metadata: {
        platform: 'apex',
        ...metadata,
      },
    });
  }

  /**
   * Create Subscription with incomplete status (for 3D Secure)
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete', // Handles 3D Secure
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });
  }

  /**
   * Update Subscription (Upgrade/Downgrade)
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    return this.stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
  }

  /**
   * Cancel Subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;

    if (cancelAtPeriodEnd) {
      return this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      return this.stripe.subscriptions.cancel(subscriptionId);
    }
  }

  /**
   * Create Payment Intent (for one-time customer payments)
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'egp',
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent | null> {
    if (!this.stripe) return null;

    return this.stripe.paymentIntents.create({
      amount, // Amount in smallest unit (piastres for EGP)
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });
  }

  /**
   * Verify and construct webhook event
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event | null {
    if (!this.stripe) return null;

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return null;
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  }

  /**
   * Create Customer Portal session (for manage subscription)
   */
  async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session | null> {
    if (!this.stripe) return null;

    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /**
   * Create Checkout Session for Subscription
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Stripe.Checkout.Session | null> {

    // ⚠️ MOCK MODE: Bypass Stripe if using placeholder keys
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey?.includes('placeholder')) {
      this.logger.warn('⚠️ Using Mock Stripe Session (Placeholder Key Detected)');
      return {
        id: 'cs_test_mock_123',
        object: 'checkout.session',
        url: `${successUrl}&session_id=mock_session_123`,
        status: 'open',
        payment_status: 'unpaid',
      } as any; // Cast to any to avoid mocking 100+ properties
    }

    if (!this.stripe) return null;

    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_collection: 'if_required',
    });
  }

  /**
   * Retrieve subscription
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.stripe) return null;
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }
}
