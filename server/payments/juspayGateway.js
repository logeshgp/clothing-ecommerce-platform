import { PaymentGateway } from './gateway.js';

/**
 * Juspay (HyperCheckout) session API.
 *
 * Set PAYMENT_PROVIDER=juspay with JUSPAY_MERCHANT_ID / JUSPAY_API_KEY.
 * Juspay is redirect-based: we create a session, send the customer to the
 * returned URL, and confirm the status when they come back.
 */
export class JuspayGateway extends PaymentGateway {
  get id() {
    return 'juspay';
  }

  get label() {
    return 'Juspay';
  }

  get configured() {
    return Boolean(this.options.merchantId && this.options.apiKey);
  }

  get supports() {
    return ['card', 'upi', 'netbanking', 'wallet', 'emi'];
  }

  get #headers() {
    const token = Buffer.from(`${this.options.apiKey}:`).toString('base64');
    return {
      Authorization: `Basic ${token}`,
      'x-merchantid': this.options.merchantId,
      'Content-Type': 'application/json',
    };
  }

  async createIntent(order) {
    if (!this.configured) {
      throw Object.assign(new Error('Juspay credentials are not configured.'), { status: 503 });
    }

    const response = await fetch(`${this.options.baseUrl}/session`, {
      method: 'POST',
      headers: this.#headers,
      body: JSON.stringify({
        order_id: order.id,
        amount: String(order.total),
        customer_id: order.contact?.email ?? order.id,
        customer_email: order.contact?.email ?? '',
        customer_phone: order.contact?.phone ?? '',
        payment_page_client_id: this.options.merchantId,
        action: 'paymentPage',
        return_url: order.returnUrl,
        currency: 'INR',
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw Object.assign(new Error(`Juspay session failed: ${detail}`), { status: 502 });
    }

    const data = await response.json();

    return {
      reference: data.id ?? order.id,
      redirectUrl: data.payment_links?.web ?? null,
      clientConfig: {
        provider: 'juspay',
        collect: 'redirect',
        sessionId: data.id ?? order.id,
        redirectUrl: data.payment_links?.web ?? null,
      },
    };
  }

  /** Status is always fetched from Juspay — never trusted from the client. */
  async confirm(payload) {
    const orderId = payload.orderId ?? payload.reference;

    const response = await fetch(`${this.options.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      headers: this.#headers,
    });
    const data = await response.json();

    const paid = ['CHARGED', 'COD_INITIATED'].includes(data.status);
    return {
      paid,
      reference: data.txn_id ?? orderId,
      method: data.payment_method_type?.toLowerCase() ?? 'card',
      last4: data.card?.last_four_digits ?? '',
      error: paid ? undefined : `Payment status: ${data.status}`,
      raw: data,
    };
  }
}
