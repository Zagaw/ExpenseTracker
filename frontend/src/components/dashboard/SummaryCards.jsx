import { CalendarDays, Receipt, Scale, Tags, TrendingUp, Wallet } from 'lucide-react';
import PageIcon from '../common/PageIcon';
import { translatePhrase } from '../../i18n';
import { formatMoney } from '../../utils/currency';

export default function SummaryCards({ summary }) {
  const cards = [
    {
      label: 'Total balance',
      value: formatMoney(summary.balance),
      hint: 'Income minus expenses',
      icon: Scale,
      className: summary.balance < 0 ? 'text-danger' : 'text-ink',
    },
    {
      label: 'Total income',
      value: formatMoney(summary.totalIncome),
      hint: 'All time',
      icon: Wallet,
      className: 'text-ink',
    },
    {
      label: 'Total expenses',
      value: formatMoney(summary.totalExpenses),
      hint: 'All time',
      icon: Receipt,
      className: 'text-ink',
    },
    {
      label: 'Monthly spending',
      value: formatMoney(summary.monthlyExpenses),
      hint: 'This month',
      icon: TrendingUp,
      className: 'text-ink',
    },
    {
      label: 'Average daily spending',
      value: formatMoney(summary.averageDailySpending),
      hint: 'This month',
      icon: CalendarDays,
      className: 'text-ink',
    },
    {
      label: 'Top category',
      value: summary.topCategory ? translatePhrase(summary.topCategory.name) : translatePhrase('None yet'),
      hint: summary.topCategory ? translatePhrase(`${formatMoney(summary.topCategory.amount)} this month`) : translatePhrase('No spending this month'),
      icon: Tags,
      className: 'text-ink',
    },
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-border bg-surface px-4 py-4">
          <div className="flex items-center gap-3">
            <PageIcon icon={card.icon} />
            <h2 className="text-sm text-muted">{translatePhrase(card.label)}</h2>
          </div>
          <p className={`mt-3 text-xl font-semibold ${card.className}`}>{card.value}</p>
          <p className="mt-1 text-sm text-muted">{translatePhrase(card.hint)}</p>
        </article>
      ))}
    </div>
  );
}
