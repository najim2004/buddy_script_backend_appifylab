import Stripe from 'stripe';
import env from '../../app/env';
import logger from '../../app/logger';

// ---------------------------------------------------------------------------
// Stripe client initialisation
// ---------------------------------------------------------------------------

if (!env.STRIPE_SECRET_KEY) {
  logger.warn(
    '⚠️  STRIPE_SECRET_KEY is not set. Stripe features will not function.',
  );
}

/**
 * Stripe SDK client.
 *
 * Initialised with an empty string if the secret key is missing so the module
 * can be imported without crashing — operations will fail at runtime with a
 * clear Stripe authentication error.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
});

// ---------------------------------------------------------------------------
// StripePaymentService
// ---------------------------------------------------------------------------

export class StripePaymentService {
  async createPaymentMethod(
    card: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
    },
    billingDetails: Stripe.PaymentMethodCreateParams.BillingDetails,
  ): Promise<Stripe.PaymentMethod> {
    return stripe.paymentMethods.create({
      type: 'card',
      card,
      billing_details: billingDetails,
    });
  }

  async createCustomer(
    userId: string,
    name: string,
    email: string,
  ): Promise<Stripe.Customer> {
    return stripe.customers.create({
      name,
      email,
      metadata: { user_id: userId },
      description: 'Customer created via API',
    }) as Promise<Stripe.Customer>;
  }

  async attachPaymentMethodToCustomer(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    return stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<Stripe.Customer> {
    return stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    }) as Promise<Stripe.Customer>;
  }

  async updateCustomer(
    customerId: string,
    name: string,
    email: string,
  ): Promise<Stripe.Customer> {
    return stripe.customers.update(customerId, {
      name,
      email,
    }) as Promise<Stripe.Customer>;
  }

  async getCustomer(
    id: string,
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return stripe.customers.retrieve(id);
  }

  async createBillingPortalSession(
    customerId: string,
    returnUrl = env.APP_URL,
  ): Promise<Stripe.BillingPortal.Session> {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata?: Stripe.MetadataParam,
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency,
      customer: customerId,
      ...(metadata && { metadata }),
    });
  }

  async createCheckoutSession(
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    successUrl = `${env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl = `${env.APP_URL}/payment/cancelled`,
  ): Promise<Stripe.Checkout.Session> {
    return stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createSubscriptionCheckout(
    customerId: string,
    priceId: string,
    trialDays = 14,
    successUrl = `${env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl = `${env.APP_URL}/payment/cancelled`,
  ): Promise<Stripe.Checkout.Session> {
    return stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: trialDays },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createConnectedAccount(email: string): Promise<Stripe.Account> {
    return stripe.accounts.create({
      type: 'express',
      email,
      country: 'US',
      capabilities: { transfers: { requested: true } },
    });
  }

  async createAccountOnboardingLink(
    accountId: string,
  ): Promise<Stripe.AccountLink> {
    return stripe.accountLinks.create({
      account: accountId,
      refresh_url: env.APP_URL,
      return_url: env.APP_URL,
      type: 'account_onboarding',
    });
  }

  async createTransfer(
    destinationAccountId: string,
    amount: number,
    currency: string,
  ): Promise<Stripe.Transfer> {
    return stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency,
      destination: destinationAccountId,
    });
  }

  async createPayout(
    accountId: string,
    amount: number,
    currency: string,
  ): Promise<Stripe.Payout> {
    return stripe.payouts.create(
      { amount: Math.round(amount * 100), currency },
      { stripeAccount: accountId },
    );
  }

  async getBalance(accountId: string): Promise<Stripe.Balance> {
    return stripe.balance.retrieve({}, { stripeAccount: accountId });
  }

  async createBankAccountToken(
    bankAccount: Stripe.TokenCreateParams.BankAccount,
  ): Promise<Stripe.Token> {
    return stripe.tokens.create({ bank_account: bankAccount });
  }

  async attachBankAccount(
    customerId: string,
    bankAccountToken: string,
  ): Promise<Stripe.CustomerSource> {
    return stripe.customers.createSource(customerId, {
      source: bankAccountToken,
    });
  }

  async verifyBankAccount(
    customerId: string,
    bankAccountId: string,
    amounts: [number, number],
  ): Promise<Stripe.CustomerSource> {
    return stripe.customers.verifySource(customerId, bankAccountId, {
      amounts,
    });
  }

  async createACHPaymentIntent(
    customerId: string,
    amount: number,
  ): Promise<Stripe.PaymentIntent> {
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: customerId,
      payment_method_types: ['us_bank_account'],
      payment_method_options: {
        us_bank_account: { verification_method: 'automatic' },
      },
    });
  }

  /**
   * Validate and parse an incoming Stripe webhook event.
   * Throws a `Stripe.errors.StripeSignatureVerificationError` on invalid signatures.
   */
  constructWebhookEvent(
    rawBody: string | Buffer,
    signature: string,
  ): Stripe.Event {
    const secret = env.STRIPE_WEBHOOK_SECRET ?? '';
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  }
}

export const stripePaymentService = new StripePaymentService();
export default stripePaymentService;
