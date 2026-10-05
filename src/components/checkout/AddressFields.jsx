import { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { findCountry } from '../../../shared/geo.js';
import { FormField } from './FormField';

/**
 * Country-aware address block.
 *
 * Picking a country swaps the state list, relabels the postcode field and
 * changes its validation pattern — India gets "State / PIN code", the UK gets
 * "County / Postcode", and so on.
 */
export function AddressFields({ values, errors, onChange, idPrefix = '' }) {
  const { countries } = useStore();

  const list = countries.length ? countries : [];
  const country = useMemo(() => findCountry(values.country) ?? list[0], [values.country, list]);

  const id = (name) => `${idPrefix}${name}`;

  function handleCountryChange(event) {
    // Clearing the state prevents an impossible country/state pair surviving.
    onChange({ country: event.target.value, state: '' });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        id={id('firstName')}
        label="First name"
        autoComplete="given-name"
        value={values.firstName}
        onChange={(e) => onChange({ firstName: e.target.value })}
        error={errors.firstName}
      />
      <FormField
        id={id('lastName')}
        label="Last name"
        autoComplete="family-name"
        value={values.lastName}
        onChange={(e) => onChange({ lastName: e.target.value })}
        error={errors.lastName}
      />

      <FormField
        id={id('line1')}
        label="Address"
        autoComplete="address-line1"
        className="sm:col-span-2"
        value={values.line1}
        onChange={(e) => onChange({ line1: e.target.value })}
        error={errors.line1}
      />
      <FormField
        id={id('line2')}
        label="Apartment, landmark (optional)"
        autoComplete="address-line2"
        className="sm:col-span-2"
        value={values.line2}
        onChange={(e) => onChange({ line2: e.target.value })}
      />

      <FormField
        id={id('country')}
        label="Country"
        as="select"
        autoComplete="country-name"
        value={values.country}
        onChange={handleCountryChange}
        error={errors.country}
      >
        {list.map((item) => (
          <option key={item.code} value={item.name}>
            {item.name}
          </option>
        ))}
      </FormField>

      <FormField
        id={id('state')}
        label={country?.stateLabel ?? 'State'}
        as="select"
        autoComplete="address-level1"
        value={values.state}
        onChange={(e) => onChange({ state: e.target.value })}
        error={errors.state}
      >
        <option value="">Select {(country?.stateLabel ?? 'state').toLowerCase()}…</option>
        {(country?.states ?? []).map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </FormField>

      <FormField
        id={id('city')}
        label="City"
        autoComplete="address-level2"
        value={values.city}
        onChange={(e) => onChange({ city: e.target.value })}
        error={errors.city}
      />

      <FormField
        id={id('postalCode')}
        label={country?.postalLabel ?? 'Postal code'}
        autoComplete="postal-code"
        inputMode={country?.code === 'IN' ? 'numeric' : 'text'}
        value={values.postalCode}
        onChange={(e) => onChange({ postalCode: e.target.value.toUpperCase() })}
        error={errors.postalCode}
        hint={country ? `e.g. ${country.postalExample}` : undefined}
      />
    </div>
  );
}
