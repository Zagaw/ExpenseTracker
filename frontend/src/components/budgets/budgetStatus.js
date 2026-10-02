import { translatePhrase } from '../../i18n';
import { formatMoney } from '../../utils/currency';

export const BUDGET_STATUS = {
  normal: { label: 'On track', bar: 'bg-primary', text: 'text-ink' },
  warning: { label: 'Warning', bar: 'bg-warning', text: 'text-warning' },
  danger: { label: 'Near limit', bar: 'bg-danger', text: 'text-danger' },
  exceeded: { label: 'Over budget', bar: 'bg-danger', text: 'text-danger' },
};

export function budgetTitle(budget) {
  return budget.category?.name || 'Overall';
}

export function remainingText(budget) {
  if (budget.remaining < 0) {
    return translatePhrase(`${formatMoney(Math.abs(budget.remaining))} over budget`);
  }

  return translatePhrase(`${formatMoney(budget.remaining)} remaining`);
}
