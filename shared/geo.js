/**
 * Country / state / postcode reference data, shared by the browser and the API
 * so both sides validate addresses identically.
 */

export const COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    postalLabel: 'PIN code',
    postalPattern: '^[1-9][0-9]{5}$',
    postalExample: '600001',
    phonePattern: '^(\\+?91[- ]?)?[6-9][0-9]{9}$',
    stateLabel: 'State',
    states: [
      'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
      'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
      'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
      'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
      'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    ],
  },
  {
    code: 'US',
    name: 'United States',
    postalLabel: 'ZIP code',
    postalPattern: '^\\d{5}(-\\d{4})?$',
    postalExample: '94109',
    phonePattern: '^(\\+?1[- ]?)?\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}$',
    stateLabel: 'State',
    states: [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
      'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
      'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
      'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
      'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
      'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming',
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    postalLabel: 'Postcode',
    postalPattern: '^[A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$',
    postalExample: 'SW1A 1AA',
    phonePattern: '^(\\+?44[- ]?)?0?7\\d{9}$',
    stateLabel: 'County / region',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    postalLabel: 'PO box (optional)',
    postalPattern: '^\\d{0,6}$',
    postalExample: '00000',
    phonePattern: '^(\\+?971[- ]?)?5\\d{8}$',
    stateLabel: 'Emirate',
    states: [
      'Abu Dhabi', 'Ajman', 'Dubai', 'Fujairah', 'Ras Al Khaimah', 'Sharjah', 'Umm Al Quwain',
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    postalLabel: 'Postal code',
    postalPattern: '^\\d{6}$',
    postalExample: '238839',
    phonePattern: '^(\\+?65[- ]?)?[89]\\d{7}$',
    stateLabel: 'District',
    states: ['Central', 'East', 'North', 'North-East', 'West'],
  },
  {
    code: 'AU',
    name: 'Australia',
    postalLabel: 'Postcode',
    postalPattern: '^\\d{4}$',
    postalExample: '2000',
    phonePattern: '^(\\+?61[- ]?)?4\\d{8}$',
    stateLabel: 'State / territory',
    states: [
      'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
      'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    postalLabel: 'Postal code',
    postalPattern: '^[A-Z]\\d[A-Z][ -]?\\d[A-Z]\\d$',
    postalExample: 'M5V 2T6',
    phonePattern: '^(\\+?1[- ]?)?\\(?\\d{3}\\)?[- ]?\\d{3}[- ]?\\d{4}$',
    stateLabel: 'Province / territory',
    states: [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
      'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
      'Quebec', 'Saskatchewan', 'Yukon',
    ],
  },
];

export const COUNTRY_BY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.name, c]));
export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function findCountry(value) {
  if (!value) return null;
  return COUNTRY_BY_NAME[value] ?? COUNTRY_BY_CODE[String(value).toUpperCase()] ?? null;
}

/** Indian PIN codes encode the region in their first digit. */
const PIN_REGIONS = {
  1: 'Delhi, Haryana, Punjab, Himachal Pradesh, Jammu and Kashmir, Ladakh, Chandigarh',
  2: 'Uttar Pradesh, Uttarakhand',
  3: 'Rajasthan, Gujarat, Dadra and Nagar Haveli and Daman and Diu',
  4: 'Maharashtra, Madhya Pradesh, Chhattisgarh, Goa',
  5: 'Andhra Pradesh, Telangana, Karnataka',
  6: 'Tamil Nadu, Kerala, Puducherry, Lakshadweep',
  7: 'West Bengal, Odisha, Assam, Sikkim, and the North East',
  8: 'Bihar, Jharkhand',
};

const PIN_PREFIX_BY_STATE = {
  Delhi: ['11'],
  Haryana: ['12', '13'],
  Punjab: ['14', '15', '16'],
  'Himachal Pradesh': ['17'],
  'Jammu and Kashmir': ['18', '19'],
  Ladakh: ['19'],
  Chandigarh: ['16'],
  'Uttar Pradesh': ['20', '21', '22', '23', '24', '25', '26', '27', '28'],
  Uttarakhand: ['24', '26'],
  Rajasthan: ['30', '31', '32', '33', '34'],
  Gujarat: ['36', '37', '38', '39'],
  'Dadra and Nagar Haveli and Daman and Diu': ['39', '36'],
  Maharashtra: ['40', '41', '42', '43', '44'],
  'Madhya Pradesh': ['45', '46', '47', '48'],
  Chhattisgarh: ['49'],
  Goa: ['40'],
  Telangana: ['50', '51'],
  'Andhra Pradesh': ['51', '52', '53'],
  Karnataka: ['56', '57', '58', '59'],
  'Tamil Nadu': ['60', '61', '62', '63', '64'],
  Puducherry: ['60', '63'],
  Kerala: ['67', '68', '69'],
  Lakshadweep: ['68'],
  'West Bengal': ['70', '71', '72', '73', '74'],
  Odisha: ['75', '76', '77'],
  Assam: ['78'],
  'Arunachal Pradesh': ['79'],
  Nagaland: ['79'],
  Manipur: ['79'],
  Mizoram: ['79'],
  Tripura: ['79'],
  Meghalaya: ['79'],
  Sikkim: ['73'],
  'Andaman and Nicobar Islands': ['74'],
  Bihar: ['80', '81', '82', '83', '84', '85'],
  Jharkhand: ['81', '82', '83'],
};

export function describePin(pin) {
  const first = String(pin).charAt(0);
  return PIN_REGIONS[first] ?? null;
}

/**
 * Validates an address against its country's rules.
 * @returns {{errors: Record<string,string>, warnings: Record<string,string>}}
 */
export function validateAddress(address) {
  const errors = {};
  const warnings = {};

  const country = findCountry(address.country);
  if (!country) {
    errors.country = 'Choose a country from the list.';
    return { errors, warnings };
  }

  if (!String(address.line1 || '').trim()) errors.line1 = 'Address is required.';
  if (!String(address.city || '').trim()) errors.city = 'City is required.';

  const state = String(address.state || '').trim();
  if (!state) {
    errors.state = `${country.stateLabel} is required.`;
  } else if (!country.states.some((s) => s.toLowerCase() === state.toLowerCase())) {
    errors.state = `Choose a valid ${country.stateLabel.toLowerCase()} for ${country.name}.`;
  }

  const postal = String(address.postalCode || '').trim().toUpperCase();
  if (!postal && country.code !== 'AE') {
    errors.postalCode = `${country.postalLabel} is required.`;
  } else if (postal && !new RegExp(country.postalPattern, 'i').test(postal)) {
    errors.postalCode = `Enter a valid ${country.postalLabel.toLowerCase()} (e.g. ${country.postalExample}).`;
  }

  // India: cross-check that the PIN prefix matches the chosen state.
  if (country.code === 'IN' && !errors.postalCode && !errors.state && postal) {
    const prefixes = PIN_PREFIX_BY_STATE[matchState(country, state)];
    if (prefixes && !prefixes.some((prefix) => postal.startsWith(prefix))) {
      errors.postalCode = `PIN ${postal} doesn't belong to ${state}. ${
        describePin(postal) ? `It looks like ${describePin(postal)}.` : ''
      }`.trim();
    }
  }

  if (address.phone != null && String(address.phone).trim()) {
    if (!new RegExp(country.phonePattern).test(String(address.phone).replace(/\s/g, ''))) {
      warnings.phone = `That doesn't look like a ${country.name} mobile number.`;
    }
  }

  return { errors, warnings };
}

function matchState(country, state) {
  return country.states.find((s) => s.toLowerCase() === state.toLowerCase()) ?? state;
}

export function statesFor(countryValue) {
  return findCountry(countryValue)?.states ?? [];
}
