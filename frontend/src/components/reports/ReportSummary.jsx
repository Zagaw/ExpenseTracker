import { CalendarDays, Receipt, Scale, Tags, Wallet } from 'lucide-react';
import PageIcon from '../common/PageIcon';
import { translatePhrase } from '../../i18n';
import { formatMoney } from '../../utils/currency';

export default function ReportSummary({ summary }) {
  const cards = [
    {
      label: 'Income',
      value: formatMoney(summary.income),
      hint: countLabel(summary.incomeCount, 'income record'),
      icon: Wallet,
      className: 'text-ink',
    },
    {
      label: 'Expenses',
      value: formatMoney(summary.expenses),
      hint: countLabel(summary.expenseCount, 'expense'),
      icon: Receipt,
      className: 'text-ink',
    },
    {
      label: 'Balance',
      value: formatMoney(summary.balance),
      hint: 'Income minus expenses',
      icon: Scale,
      className: summary.balance < 0 ? 'text-danger' : 'text-ink',
    },
    {
      label: 'Average daily spending',
      value: formatMoney(summary.averageDailySpending),
      hint: 'Across this period',
      icon: CalendarDays,
      className: 'text-ink',
    },
    {
      label: 'Top category',
      value: summary.topCategory ? translatePhrase(summary.topCategory.name) : translatePhrase('None yet'),
      hint: summary.topCategory ? formatMoney(summary.topCategory.amount) : translatePhrase('No spending in this period'),
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

function countLabel(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}
