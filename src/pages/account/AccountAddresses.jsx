import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { validateAddress } from '../../../shared/geo.js';
import { isRequired } from '../../utils/validation';
import { AddressFields } from '../../components/checkout/AddressFields';
import { FormField } from '../../components/checkout/FormField';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { MapPinIcon, TrashIcon } from '../../components/ui/Icons';

const BLANK = {
  id: null,
  label: 'Home',
  firstName: '',
  lastName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
  isDefault: false,
};

export default function AccountAddresses() {
  const { user, saveAddress, deleteAddress } = useAuth();
  const { notify } = useToast();

  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});

  const addresses = user.addresses ?? [];

  function openNew() {
    const [firstName = '', ...rest] = (user.name ?? '').split(' ');
    setEditing({ ...BLANK, firstName, lastName: rest.join(' '), phone: user.phone ?? '' });
    setErrors({});
  }

  function set(patch) {
    setEditing((current) => ({ ...current, ...patch }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const found = {};
    if (!isRequired(editing.label)) found.label = 'Give this address a label.';
    if (!isRequired(editing.firstName)) found.firstName = 'First name is required.';
    if (!isRequired(editing.lastName)) found.lastName = 'Last name is required.';

    // Same country/state/postcode rules the checkout and API enforce.
    Object.assign(found, validateAddress(editing).errors);

    setErrors(found);
    if (Object.keys(found).length) return;

    saveAddress(editing);
    notify(editing.id ? 'Address updated.' : 'Address added.', { tone: 'success' });
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Saved addresses</h2>
        <Button onClick={openNew} size="sm">
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          mark="⌂"
          title="No addresses saved."
          description="Add one now to speed up checkout later."
        >
          <Button onClick={openNew}>Add your first address</Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col gap-3 rounded-2xl border border-sand-300 bg-sand-50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <MapPinIcon className="h-4 w-4 text-clay-500" />
                  {address.label}
                </p>
                {address.isDefault && (
                  <span className="rounded-full bg-ink-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sand-100">
                    Default
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-ink-500">
                <span className="font-medium text-ink-900">
                  {address.firstName} {address.lastName}
                </span>
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.country}
                {address.phone && (
                  <>
                    <br />
                    {address.phone}
                  </>
                )}
              </p>

              <div className="mt-auto flex items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(address);
                    setErrors({});
                  }}
                  className="text-xs font-medium underline underline-offset-4"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => saveAddress({ ...address, isDefault: true })}
                    className="text-xs font-medium text-ink-500 underline underline-offset-4 hover:text-ink-900"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    deleteAddress(address.id);
                    notify('Address removed.');
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-ink-500 hover:text-berry-500"
                >
                  <TrashIcon className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit address' : 'Add address'}
      >
        {editing && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4 p-6">
            <FormField
              id="addr-label"
              label="Label"
              value={editing.label}
              onChange={(e) => set({ label: e.target.value })}
              error={errors.label}
              placeholder="Home, Work…"
            />

            <AddressFields
              values={editing}
              errors={errors}
              onChange={set}
              idPrefix="addr-"
            />

            <FormField
              id="addr-phone"
              label="Phone (optional)"
              type="tel"
              value={editing.phone}
              onChange={(e) => set({ phone: e.target.value })}
              error={errors.phone}
            />

            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(e) => set({ isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-sand-400 accent-[var(--color-ink-900)]"
              />
              Make this my default address
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save address
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
