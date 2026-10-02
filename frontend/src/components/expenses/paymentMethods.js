import { translatePhrase } from '../../i18n';

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_wallet', label: 'Mobile wallet' },
  { value: 'other', label: 'Other' },
];

export function paymentLabel(value) {
  const label = PAYMENT_METHODS.find((method) => method.value === value)?.label || value;
  return translatePhrase(label);
}
