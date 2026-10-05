/**
 * Payment gateway framework.
 *
 * Every provider implements the same small contract, so swapping Razorpay for
 * Juspay (or anything else) is a config change, never a code change:
 *
 *   createIntent(order)  → { reference, clientConfig, redirectUrl? }
 *   confirm(payload)     → { paid, reference, method, last4, raw }
 *   verifyWebhook(req)   → { valid, event }
 *   describe()           → { id, label, mode, supports }
 *
 * `clientConfig` is the only part that reaches the browser, and it must never
 * contain secrets — just the public key id and the amount to render.
 */

export class PaymentGateway {
  constructor(options = {}) {
    this.options = options;
  }

  get id() {
    return 'base';
  }

  get label() {
    return 'Payment gateway';
  }

  /** True when the provider has everything it needs to take live payments. */
  get configured() {
    return false;
  }

  describe() {
    return {
      id: this.id,
      label: this.label,
      configured: this.configured,
      mode: this.configured ? 'live' : 'test',
      supports: this.supports ?? ['card'],
    };
  }

  // eslint-disable-next-line no-unused-vars
  async createIntent(order) {
    throw new Error('createIntent() not implemented.');
  }

  // eslint-disable-next-line no-unused-vars
  async confirm(payload) {
    throw new Error('confirm() not implemented.');
  }

  // eslint-disable-next-line no-unused-vars
  async verifyWebhook(rawBody, headers) {
    return { valid: false, event: null };
  }
}

/** Amounts are stored in rupees; most Indian gateways expect paise. */
export function toMinorUnits(amount) {
  return Math.round(Number(amount) * 100);
}

export function fromMinorUnits(amount) {
  return Number(amount) / 100;
}
