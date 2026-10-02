import { PiggyBank } from 'lucide-react';
import CategoryIcon from '../categories/CategoryIcon';
import PageIcon from '../common/PageIcon';
import { BUDGET_STATUS, budgetTitle, remainingText } from './budgetStatus';
import { translatePhrase } from '../../i18n';
import { formatMoney } from '../../utils/currency';

export default function BudgetProgressCard({ budget, actions }) {
  const status = BUDGET_STATUS[budget.status] || BUDGET_STATUS.normal;
  const title = budgetTitle(budget);
  const width = Math.min(budget.percentage, 100);

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {budget.category ? (
            <CategoryIcon name={budget.category.icon} color={budget.category.color} />
          ) : (
            <PageIcon icon={PiggyBank} />
          )}
          <h2 className="font-medium text-ink">{translatePhrase(title)}</h2>
        </div>
        <p className={`text-sm font-medium ${status.text}`}>{translatePhrase(status.label)}</p>
      </div>
      <p className="mt-2 text-sm text-ink">
        {formatMoney(budget.spent)}
        {' / '}
        {formatMoney(budget.amount)}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}
        aria-label={translatePhrase(`${title} budget ${budget.percentage}% used, ${status.label}`)}
      >
        <div className={`h-full ${status.bar}`} style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {translatePhrase(`${budget.percentage}% used`)}
        {' · '}
        {remainingText(budget)}
      </p>
      {actions ? <div className="mt-4 flex justify-end gap-2">{actions}</div> : null}
    </article>
  );
}
