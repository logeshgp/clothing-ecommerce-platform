/**
 * UPI deep-link demo.
 *
 * This builds a Google Pay `tez://upi/pay` link so the checkout flow can be
 * demonstrated end to end. It is NOT a payment integration: nothing is
 * verified, confirmed or recorded, and the recipient below is a placeholder.
 *
 * The placeholder is deliberately a syntactically invalid VPA so it can never
 * resolve to a real account. Set `VITE_UPI_PAYEE_VPA` to a VPA you control
 * before using this with a real payment app.
 */

/**
 * Not a routable VPA — the handle contains a character UPI does not allow, so
 * a payment app will refuse it rather than silently sending money to a
 * stranger who happens to own `demo@upi`.
 */
export const DEMO_UPI_ID = 'demo@invalid-upi';

/** UPI VPA grammar: `name@handle`, alphanumerics plus `.`, `-`, `_`. */
const VPA_RE = /^[a-z0-9.\-_]{2,64}@[a-z0-9.\-_]{2,32}$/i;

/** Largest amount the demo will put in a payment draft. */
const MAX_AMOUNT = 1_000_000;

/** Configured payee, or the non-routable placeholder when unset. */
export function payeeVpa() {
  const configured = String(import.meta.env.VITE_UPI_PAYEE_VPA ?? '').trim();
  return VPA_RE.test(configured) ? configured : DEMO_UPI_ID;
}

/** True when no real payee has been configured — the link is a dry run. */
export function isPlaceholderPayee() {
  return payeeVpa() === DEMO_UPI_ID;
}

/** Collapses control characters and caps length before putting text in a URL. */
function safeText(value, fallback, maxLength) {
  const cleaned = String(value ?? '')
    // Input validation fix: strip control characters before building the URL
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  return cleaned || fallback;
}

export function buildGooglePayDemoUrl({ amount, payeeName, transactionNote }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('A positive amount is required to build the UPI payment draft.');
  }
  // Input validation fix: reject absurd amounts instead of forwarding them to a payment app
  if (value > MAX_AMOUNT) {
    throw new Error('That amount is too large for the UPI demo.');
  }

  const vpa = payeeVpa();
  if (!VPA_RE.test(vpa) && vpa !== DEMO_UPI_ID) {
    throw new Error('The configured UPI ID is not a valid VPA.');
  }

  // URLSearchParams percent-encodes every value, so store-controlled text
  // cannot inject extra UPI parameters such as `&pa=attacker@bank`.
  const params = new URLSearchParams({
    pa: vpa,
    pn: safeText(payeeName, 'Store', 80),
    am: value.toFixed(2),
    cu: 'INR',
    tn: safeText(transactionNote, 'Demo checkout', 120),
  });

  return `tez://upi/pay?${params.toString()}`;
}
