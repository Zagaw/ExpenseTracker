let activeCurrency = 'MMK';

export function syncActiveCurrency(currency) {
  activeCurrency = typeof currency === 'string' && currency ? currency : 'MMK';
}

export function formatMoney(amount, currency = activeCurrency) {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} ${currency}`;
}
