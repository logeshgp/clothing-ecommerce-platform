import { useState } from 'react';
import { useConsoleAuth } from '../context/ConsoleAuthContext';
import { useToast } from '@store/context/ToastContext';
import { classNames } from '@store/utils/format';
import { Button } from '@store/components/ui/Button';
import { FormField } from '@store/components/checkout/FormField';
import { LockIcon, ShieldIcon } from '@store/components/ui/Icons';

/**
 * Staff sign-in. Both methods hit the same endpoints as the storefront; the
 * server decides whether the address is on an allowlist, so a customer who
 * finds this page still cannot get in.
 */
export default function ConsoleLogin() {
  const { login, loginWithCode, requestCode } = useConsoleAuth();
  const { notify } = useToast();

  const [mode, setMode] = useState('password');
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState(null);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const { [field]: _drop, ...rest } = current;
      return rest;
    });
  }

  async function handlePassword(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const user = await login({ email: form.email, password: form.password });
      if (!['admin', 'support'].includes(user.role)) {
        setErrors({ email: 'That account is not allowed to use the console.' });
        return;
      }
      notify(`Signed in as ${user.role}.`, { tone: 'success' });
    } catch (error) {
      setErrors({ password: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleRequestCode(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await requestCode(form.email);
      setCodeSent(true);
      setDevCode(result.devCode ?? null);
      notify('Code sent.', { tone: 'success' });
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const user = await loginWithCode({ email: form.email, code: form.code });
      if (!['admin', 'support'].includes(user.role)) {
        setErrors({ code: 'That account is not allowed to use the console.' });
      }
    } catch (error) {
      setErrors({ code: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 p-6">
      <div className="w-full max-w-md rounded-3xl bg-sand-50 p-8 shadow-[var(--shadow-lift)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sand-100">
            <ShieldIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="dnd-eyebrow mb-0">DND Store</p>
            <h1 className="text-xl font-bold">Staff console</h1>
          </div>
        </div>

        <p className="mb-6 rounded-2xl bg-sand-200 p-4 text-xs leading-relaxed text-ink-500">
          Access is restricted to approved email addresses. Attempts are logged.
        </p>

        <div className="mb-5 flex rounded-full border border-sand-300 bg-white p-1">
          {[
            { id: 'password', label: 'Password' },
            { id: 'code', label: 'Email code' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setMode(option.id);
                setErrors({});
              }}
              className={classNames(
                'flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                mode === option.id ? 'bg-ink-900 text-sand-100' : 'text-ink-500 hover:text-ink-900',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePassword} noValidate className="space-y-4">
            <FormField
              id="console-email"
              label="Work email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
            />
            <FormField
              id="console-password"
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
        ) : !codeSent ? (
          <form onSubmit={handleRequestCode} noValidate className="space-y-4">
            <FormField
              id="console-code-email"
              label="Work email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
            />
            <Button type="submit" full size="lg" loading={busy}>
              Send me a code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate className="space-y-4">
            {devCode && (
              <p className="rounded-xl bg-sand-200 px-3.5 py-2.5 text-xs text-ink-500">
                Development code:{' '}
                <strong className="font-[family-name:var(--font-display)] text-base text-ink-900">
                  {devCode}
                </strong>
              </p>
            )}
            <FormField
              id="console-code"
              label="Six-digit code"
              inputMode="numeric"
              maxLength={6}
              value={form.code}
              onChange={(e) => set('code', e.target.value.replace(/\D/g, ''))}
              error={errors.code}
            />
            <Button type="submit" full size="lg" loading={busy}>
              Verify and sign in
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
