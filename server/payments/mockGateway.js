import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { PaymentGateway, toMinorUnits } from './gateway.js';

/**
 * Offline gateway used for development and demos.
 *
 * It mirrors the real flow exactly — create an intent, collect details, confirm
 * — but authorises locally using Luhn plus a couple of well-known test cards,
 * so the UI and order pipeline can be exercised without any credentials.
 */
export class MockGateway extends PaymentGateway {
  get id() {
    return 'mock';
  }

  get label() {
    return 'Test gateway (offline)';
  }

  get configured() {
    return true;
  }

  get supports() {
    return ['card', 'upi', 'cod'];
  }

  async createIntent(order) {
    return {
      reference: `mock_${randomUUID()}`,
      clientConfig: {
        provider: 'mock',
        amount: toMinorUnits(order.total),
        currency: 'INR',
        collect: 'inline',
        testCards: {
          success: '4242 4242 4242 4242',
          failure: '4000 0000 0000 0002',
        },
      },
    };
  }

  async confirm(payload) {
    // Payment bypass fix: this gateway authorises locally with no bank in the
    // loop, so it must never settle an order in a production deployment.
    if (config.isProduction) {
      throw Object.assign(
        new Error('The test payment gateway cannot be used in production.'),
        { status: 503 },
      );
    }

    const digits = String(payload.cardNumber || '').replace(/\D/g, '');

    if (payload.method === 'cod') {
      return { paid: true, reference: payload.reference, method: 'cod', last4: '----', raw: {} };
    }

    if (payload.method === 'upi') {
      const valid = /^[\w.-]{2,}@[a-z]{2,}$/i.test(String(payload.upiId || ''));
      return {
        paid: valid,
        reference: payload.reference,
        method: 'upi',
        last4: valid ? String(payload.upiId).slice(-4) : '',
        error: valid ? undefined : 'Enter a valid UPI ID, e.g. name@bank.',
        raw: {},
      };
    }

    if (digits === '4000000000000002') {
      return { paid: false, reference: payload.reference, error: 'Card declined by issuer.' };
    }

    if (!luhn(digits)) {
      return { paid: false, reference: payload.reference, error: 'Enter a valid card number.' };
    }

    return {
      paid: true,
      reference: payload.reference,
      method: 'card',
      last4: digits.slice(-4),
      raw: { authorisedAt: new Date().toISOString() },
    };
  }
}

function luhn(digits) {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}
