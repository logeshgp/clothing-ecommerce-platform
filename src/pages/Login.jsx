import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isEmail, isRequired } from '../utils/validation';
import { classNames } from '../utils/format';
import { FormField } from '../components/checkout/FormField';
import { Button } from '../components/ui/Button';
import { LockIcon, CheckIcon } from '../components/ui/Icons';

const TABS = [
  { id: 'password', label: 'Password' },
  { id: 'code', label: 'Email code' },
  { id: 'guest', label: 'Continue as guest' },
];

export default function Login() {
  const { login, requestCode, verifyCode } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState('password');
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState(null);

  const redirectTo = location.state?.from ?? '/account';

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const { [field]: _drop, ...rest } = current;
      return rest;
    });
  }

  /* ----------------------------------------------------- password sign-in */

  async function handlePasswordLogin(event) {
    event.preventDefault();

    const found = {};
    if (!isEmail(form.email)) found.email = 'Enter a valid email address.';
    if (!isRequired(form.password)) found.password = 'Password is required.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const user = await login({ email: form.email, password: form.password });
      notify(`Welcome back, ${user.name || user.email}.`, { tone: 'success' });
      navigate(user.role === 'customer' ? redirectTo : '/account', { replace: true });
    } catch (error) {
      setErrors({ password: error.message });
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------------------------------- email code */

  async function handleRequestCode(event) {
    event.preventDefault();

    if (!isEmail(form.email)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }

    setBusy(true);
    try {
      const result = await requestCode(form.email);
      setCodeSent(true);
      setDevCode(result.devCode ?? null);
      notify('We sent you a six-digit code.', { tone: 'success' });
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();

    if (!/^\d{6}$/.test(form.code)) {
      setErrors({ code: 'Enter the six-digit code.' });
      return;
    }

    setBusy(true);
    try {
      const user = await verifyCode({ email: form.email, code: form.code });
      notify(`Signed in as ${user.email}.`, { tone: 'success' });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrors({ code: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dnd-container py-16">
      <div className="mx-auto max-w-md">
        <header className="space-y-2 text-center">
          <p className="dnd-eyebrow">Account</p>
          <h1 className="text-4xl font-bold">Welcome back</h1>
          <p className="text-sm text-ink-500">
            Sign in to track orders, save addresses and reach support faster.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Sign-in method"
          className="mt-8 flex rounded-full border border-sand-300 bg-sand-50 p-1"
        >
          {TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={tab === option.id}
              onClick={() => {
                setTab(option.id);
                setErrors({});
              }}
              className={classNames(
                'flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                tab === option.id ? 'bg-ink-900 text-sand-100' : 'text-ink-500 hover:text-ink-900',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* ----------------------------------------------------- password */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordLogin} noValidate className="mt-6 space-y-4">
            <FormField
              id="login-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
            />
            <FormField
              id="login-password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
            />
            <Button type="submit" full size="lg" loading={busy}>
              <LockIcon className="h-4 w-4" /> Sign in
            </Button>
          </form>
        )}

        {/* --------------------------------------------------- email code */}
        {tab === 'code' && (
          <div className="mt-6 space-y-4">
            {!codeSent ? (
              <form onSubmit={handleRequestCode} noValidate className="space-y-4">
                <FormField
                  id="code-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  error={errors.email}
                  hint="No password needed — we'll send a one-time code."
                />
                <Button type="submit" full size="lg" loading={busy}>
                  Send me a code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} noValidate className="space-y-4">
                <p className="flex items-center gap-2 rounded-xl bg-moss-500/10 px-3.5 py-2.5 text-sm text-moss-500">
                  <CheckIcon className="h-4 w-4" /> Code sent to {form.email}
                </p>

                {devCode && (
                  <p className="rounded-xl bg-sand-200 px-3.5 py-2.5 text-xs text-ink-500">
                    Development mode — your code is{' '}
                    <strong className="font-[family-name:var(--font-display)] text-base text-ink-900">
                      {devCode}
                    </strong>
                  </p>
                )}

                <FormField
                  id="login-code"
                  label="Six-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.code}
                  onChange={(e) => set('code', e.target.value.replace(/\D/g, ''))}
                  error={errors.code}
                  placeholder="123456"
                />

                <Button type="submit" full size="lg" loading={busy}>
                  Verify and sign in
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setDevCode(null);
                    set('code', '');
                  }}
                  className="w-full text-center text-xs text-ink-500 underline underline-offset-4"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- guest */}
        {tab === 'guest' && (
          <div className="mt-6 space-y-4">
            <p className="rounded-2xl border border-sand-300 bg-sand-50 p-5 text-sm leading-relaxed text-ink-500">
              You can check out without an account. We'll email and WhatsApp your receipt, and you
              can create an account later to see your order history.
            </p>
            <Button to="/cart" full size="lg">
              Continue to bag
            </Button>
            <Button to="/shop" variant="outline" full>
              Keep shopping
            </Button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-ink-500">
          New here?{' '}
          <Link to="/register" className="font-medium text-ink-900 underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
