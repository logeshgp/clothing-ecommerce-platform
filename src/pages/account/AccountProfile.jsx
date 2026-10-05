import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { useRecentlyViewed } from '../../context/RecentlyViewedContext';
import { classNames } from '../../utils/format';
import { FormField } from '../../components/checkout/FormField';
import { Button } from '../../components/ui/Button';

function strength(password) {
  const checks = [
    { label: '10+ characters', pass: password.length >= 10 },
    { label: 'lowercase', pass: /[a-z]/.test(password) },
    { label: 'uppercase', pass: /[A-Z]/.test(password) },
    { label: 'number', pass: /\d/.test(password) },
  ];
  return { checks, score: checks.filter((c) => c.pass).length };
}

export default function AccountProfile() {
  const { user, changePassword } = useAuth();
  const { notify } = useToast();
  const wishlist = useWishlist();
  const recentlyViewed = useRecentlyViewed();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const { checks, score } = strength(form.newPassword);

  async function handlePassword(event) {
    event.preventDefault();

    const found = {};
    if (!form.currentPassword) found.currentPassword = 'Enter your current password.';
    if (score < 4) found.newPassword = 'Meet all four requirements.';
    if (form.confirm !== form.newPassword) found.confirm = 'Passwords do not match.';

    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      notify('Password updated. Other devices were signed out.', { tone: 'success' });
    } catch (error) {
      setErrors({ currentPassword: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-3xl border border-sand-300 bg-sand-50 p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="dnd-label">Name</dt>
            <dd>{user.name || '—'}</dd>
          </div>
          <div>
            <dt className="dnd-label">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="dnd-label">Phone</dt>
            <dd>{user.phone || '—'}</dd>
          </div>
          <div>
            <dt className="dnd-label">Account type</dt>
            <dd className="capitalize">{user.role}</dd>
          </div>
        </dl>
      </section>

      <form
        onSubmit={handlePassword}
        noValidate
        className="space-y-4 rounded-3xl border border-sand-300 p-6"
      >
        <div>
          <h2 className="text-lg font-semibold">Change password</h2>
          <p className="mt-1 text-sm text-ink-500">
            Changing your password signs you out everywhere else.
          </p>
        </div>

        <FormField
          id="current-password"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          error={errors.currentPassword}
        />

        <div>
          <FormField
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            error={errors.newPassword}
          />

          {form.newPassword && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={classNames(
                      'h-1 flex-1 rounded-full transition-colors',
                      index < score ? (score === 4 ? 'bg-moss-500' : 'bg-clay-500') : 'bg-sand-300',
                    )}
                  />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                {checks.map((check) => (
                  <li key={check.label} className={check.pass ? 'text-moss-500' : 'text-ink-500'}>
                    {check.pass ? '✓' : '○'} {check.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <FormField
          id="confirm-password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          error={errors.confirm}
        />

        <Button type="submit" loading={busy}>
          Update password
        </Button>
      </form>

      <section className="space-y-3 rounded-3xl border border-sand-300 p-6">
        <h2 className="text-lg font-semibold">Privacy & data</h2>
        <p className="text-sm text-ink-500">
          Your wishlist and browsing history are stored on this device only.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              wishlist.clear();
              notify('Wishlist cleared.');
            }}
          >
            Clear wishlist
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              recentlyViewed.clear();
              notify('Browsing history cleared.');
            }}
          >
            Clear browsing history
          </Button>
        </div>
      </section>
    </div>
  );
}
