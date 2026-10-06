export const DEMO_UPI_ID = 'demo@upi';

export function buildGooglePayDemoUrl({ amount, payeeName, transactionNote }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('A positive amount is required to build the UPI payment draft.');
  }

  const params = new URLSearchParams({
    pa: DEMO_UPI_ID,
    pn: String(payeeName || 'Store'),
    am: value.toFixed(2),
    cu: 'INR',
    tn: String(transactionNote || 'Demo checkout'),
  });

  return `tez://upi/pay?${params.toString()}`;
}
