import { ArrowLeftRight, Receipt, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageIcon from '../common/PageIcon';
import { translatePhrase } from '../../i18n';
import { paymentLabel } from '../expenses/paymentMethods';
import { formatMoney } from '../../utils/currency';
import { formatExpenseDate } from '../../utils/dates';

export default function RecentTransactions({ transactions }) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <PageIcon icon={ArrowLeftRight} />
          <h2 className="text-base font-medium text-ink">{translatePhrase('Recent transactions')}</h2>
        </div>
        <div className="flex gap-3 text-sm font-medium">
          <Link to="/expenses" className="text-primary">{translatePhrase('Expenses')}</Link>
          <Link to="/income" className="text-primary">{translatePhrase('Income')}</Link>
        </div>
      </div>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
            <div className="flex min-w-0 items-center gap-3">
              <PageIcon icon={transaction.type === 'income' ? Wallet : Receipt} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{transaction.title}</p>
                <p className="mt-1 text-sm text-muted">{subtitle(transaction)}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-ink">{formatMoney(transaction.amount)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function subtitle(transaction) {
  const date = formatExpenseDate(transaction.date);

  if (transaction.type === 'income') {
    return `${date} · ${translatePhrase('Income')}`;
  }

  const parts = [date, translatePhrase(transaction.category || 'Uncategorized')];

  if (transaction.paymentMethod) {
    parts.push(paymentLabel(transaction.paymentMethod));
  }

  return parts.join(' · ');
}
