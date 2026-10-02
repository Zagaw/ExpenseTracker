import { Pencil, Trash2, Wallet } from 'lucide-react';
import Button from '../common/Button';
import PageIcon from '../common/PageIcon';
import { translatePhrase } from '../../i18n';
import { formatMoney } from '../../utils/currency';
import { formatExpenseDate } from '../../utils/dates';

export default function IncomeList({ income, onEdit, onDelete }) {
  return (
    <div>
      <div className="hidden overflow-hidden rounded-lg border border-border bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{translatePhrase('Date')}</th>
              <th className="px-4 py-3 font-medium">{translatePhrase('Source')}</th>
              <th className="px-4 py-3 font-medium">{translatePhrase('Description')}</th>
              <th className="px-4 py-3 text-right font-medium">{translatePhrase('Amount')}</th>
              <th className="px-4 py-3 font-medium"><span className="sr-only">{translatePhrase('Actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {income.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-muted">{formatExpenseDate(entry.incomeDate)}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  <span className="inline-flex items-center gap-2">
                    <PageIcon icon={Wallet} />
                    {entry.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{entry.description}</td>
                <td className="px-4 py-3 text-right font-medium text-ink">{formatMoney(entry.amount)}</td>
                <td className="px-4 py-3">
                  <RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {income.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <PageIcon icon={Wallet} />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{entry.source}</p>
                  <p className="mt-1 text-sm text-muted">{formatExpenseDate(entry.incomeDate)}</p>
                  {entry.description ? <p className="mt-2 text-sm text-muted">{entry.description}</p> : null}
                </div>
              </div>
              <p className="shrink-0 font-medium text-ink">{formatMoney(entry.amount)}</p>
            </div>
            <div className="mt-3">
              <RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowActions({ entry, onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        fullWidth={false}
        aria-label={`Edit ${entry.source}`}
        onClick={() => onEdit(entry)}
      >
        <Pencil className="size-4" aria-hidden="true" />
        Edit
      </Button>
      <Button
        type="button"
        variant="secondary"
        fullWidth={false}
        aria-label={`Delete ${entry.source}`}
        onClick={() => onDelete(entry)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </Button>
    </div>
  );
}

export function IncomeListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}
