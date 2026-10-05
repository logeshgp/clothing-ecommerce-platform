import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isEmail, isRequired } from '../utils/validation';
import { classNames } from '../utils/format';
import { FormField } from '../components/checkout/FormField';
import { Button } from '../components/ui/Button';

/** Mirrors the server's scrypt policy so users see problems before submitting. */
function strength(password) {
  const checks = [
    { label: '10+ characters', pass: password.length >= 10 },
    { label: 'lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'number', pass: /\d/.test(password) },
  ];
  return { checks, score: checks.filter((c) => c.pass).length };
}

export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const { checks, score } = strength(form.password);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const { [field]: _drop, ...rest } = current;
      return rest;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const found = {};
    if (!isRequired(form.name)) found.name = 'Name is required.';
    if (!isEmail(form.email)) found.email = 'Enter a valid email address.';
    if (score < 4) found.password = 'Meet all four password requirements.';
    if (form.confirm !== form.password) found.confirm = 'Passwords do not match.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      notify(`Welcome to DND Store, ${user.name}.`, { tone: 'success' });
      navigate('/account', { replace: true });
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dnd-container py-16">
      <div className="mx-auto max-w-md">
        <header className="space-y-2 text-center">
          <p className="dnd-eyebrow">Account</p>
          <h1 className="text-4xl font-bold">Create an account</h1>
          <p className="text-sm text-ink-500">
            Save your details, track orders and keep your wishlist in sync.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
          <FormField
            id="register-name"
            label="Full name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={errors.name}
          />
          <FormField
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
          />
          <FormField
            id="register-phone"
            label="WhatsApp / mobile number"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            hint="Used for order confirmations."
          />

          <div>
            <FormField
              id="register-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
            />

            {form.password && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className={classNames(
                        'h-1 flex-1 rounded-full transition-colors',
                        index < score
                          ? score === 4
                            ? 'bg-moss-500'
                            : 'bg-clay-500'
                          : 'bg-sand-300',
                      )}
                    />
                  ))}
                </div>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  {checks.map((check) => (
                    <li
                      key={check.label}
                      className={check.pass ? 'text-moss-500' : 'text-ink-500'}
                    >
                      {check.pass ? '✓' : '○'} {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <FormField
            id="register-confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            error={errors.confirm}
          />

          <Button type="submit" full size="lg" loading={busy}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-ink-900 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
