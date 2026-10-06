import { config } from '../config.js';
import { MockGateway } from './mockGateway.js';
import { RazorpayGateway } from './razorpayGateway.js';
import { JuspayGateway } from './juspayGateway.js';

/**
 * Gateway registry. Add a provider here and it becomes selectable through
 * PAYMENT_PROVIDER without touching the checkout code.
 */
const REGISTRY = {
  mock: () => new MockGateway(),
  razorpay: () => new RazorpayGateway(config.payments.razorpay),
  juspay: () => new JuspayGateway(config.payments.juspay),
};

let active = null;

export function getGateway() {
  if (active) return active;

  const factory = REGISTRY[config.payments.provider];
  if (!factory) {
    console.warn(
      `[payments] Unknown provider "${config.payments.provider}" — falling back to mock.`,
    );
    active = REGISTRY.mock();
    return active;
  }

  const candidate = factory();

  if (!candidate.configured) {
    // Payment bypass fix: the mock gateway authorises any Luhn-valid card, so a
    // production fallback is logged loudly; MockGateway itself refuses to
    // authorise anything when NODE_ENV=production.
    console.error(
      `[payments] ${candidate.label} is selected but missing credentials — falling back to mock.`,
    );
    active = REGISTRY.mock();
    return active;
  }

  active = candidate;
  return active;
}

export function listGateways() {
  return Object.entries(REGISTRY).map(([id, factory]) => {
    const gateway = factory();
    return { ...gateway.describe(), id, active: id === config.payments.provider };
  });
}
