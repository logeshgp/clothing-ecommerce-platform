import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentGateway, toMinorUnits } from './gateway.js';

/**
 * Razorpay Orders API.
 *
 * Set PAYMENT_PROVIDER=razorpay plus RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET to
 * switch the whole checkout over — no other file changes. The browser receives
 * only the public key id and the order id.
 */
export class RazorpayGateway extends PaymentGateway {
  get id() {
    return 'razorpay';
  }

  get label() {
    return 'Razorpay';
  }

  get configured() {
    return Boolean(this.options.keyId && this.options.keySecret);
  }

  get supports() {
    return ['card', 'upi', 'netbanking', 'wallet'];
  }

  get #authHeader() {
    const token = Buffer.from(`${this.options.keyId}:${this.options.keySecret}`).toString('base64');
    return `Basic ${token}`;
  }

  async createIntent(order) {
    if (!this.configured) {
      throw Object.assign(new Error('Razorpay keys are not configured.'), { status: 503 });
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.#authHeader },
      body: JSON.stringify({
        amount: toMinorUnits(order.total),
        currency: 'INR',
        receipt: order.id,
        notes: { orderId: order.id, email: order.contact?.email ?? '' },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw Object.assign(new Error(`Razorpay order failed: ${detail}`), { status: 502 });
    }

    const data = await response.json();

    return {
      reference: data.id,
      clientConfig: {
        provider: 'razorpay',
        key: this.options.keyId, // public key — safe to expose
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
        collect: 'sdk',
        checkoutScript: 'https://checkout.razorpay.com/v1/checkout.js',
      },
    };
  }

  /**
   * Razorpay signs `order_id|payment_id` with the key secret. We recompute it
   * server-side; a client claiming success without a valid signature fails.
   */
  async confirm(payload) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return { paid: false, error: 'Missing Razorpay confirmation fields.' };
    }

    const expected = createHmac('sha256', this.options.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (!safeEqual(expected, razorpaySignature)) {
      return { paid: false, error: 'Payment signature verification failed.' };
    }

    const response = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
      headers: { Authorization: this.#authHeader },
    });
    const payment = await response.json();

    const paid = ['captured', 'authorized'].includes(payment.status);
    return {
      paid,
      reference: razorpayPaymentId,
      method: payment.method ?? 'card',
      last4: payment.card?.last4 ?? payment.vpa?.slice(-4) ?? '',
      error: paid ? undefined : `Payment status: ${payment.status}`,
      raw: payment,
    };
  }

  async verifyWebhook(rawBody, headers) {
    const signature = headers['x-razorpay-signature'];
    if (!signature || !this.options.webhookSecret) return { valid: false, event: null };

    const expected = createHmac('sha256', this.options.webhookSecret).update(rawBody).digest('hex');
    if (!safeEqual(expected, signature)) return { valid: false, event: null };

    return { valid: true, event: JSON.parse(rawBody.toString('utf8')) };
  }
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
