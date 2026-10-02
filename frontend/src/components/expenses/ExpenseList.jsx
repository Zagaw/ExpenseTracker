import { Pencil, Trash2 } from 'lucide-react';
import CategoryIcon from '../categories/CategoryIcon';
import Button from '../common/Button';
import { translatePhrase } from '../../i18n';
import { formatMoney } from '../../utils/currency';
import { formatExpenseDate } from '../../utils/dates';
import { paymentLabel } from './paymentMethods';

export default function ExpenseList({ expenses, onEdit, onDelete }) {
  return (
    <div>
      <div className="hidden overflow-hidden rounded-lg border border-border bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{translatePhrase('Date')}</th>
              <th className="px-4 py-3 font-medium">{translatePhrase('Description')}</th>
              <th className="px-4 py-3 font-medium">{translatePhrase('Category')}</th>
              <th className="px-4 py-3 font-medium">{translatePhrase('Payment')}</th>
              <th className="px-4 py-3 text-right font-medium">{translatePhrase('Amount')}</th>
              <th className="px-4 py-3 font-medium"><span className="sr-only">{translatePhrase('Actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-muted">{formatExpenseDate(expense.expenseDate)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{expense.description || translatePhrase('Expense')}</p>
                  {expense.notes ? <p className="mt-1 text-muted">{expense.notes}</p> : null}
                </td>
                <td className="px-4 py-3 text-ink">
                  <span className="inline-flex items-center gap-2">
                    <CategoryIcon name={expense.category?.icon || 'circle-ellipsis'} color={expense.category?.color || '#667085'} />
                    {translatePhrase(expense.category?.name || 'Uncategorized')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{paymentLabel(expense.paymentMethod)}</td>
                <td className="px-4 py-3 text-right font-medium text-ink">{formatMoney(expense.amount)}</td>
                <td className="px-4 py-3">
                  <RowActions expense={expense} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {expenses.map((expense) => (
          <li key={expense.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <CategoryIcon name={expense.category?.icon || 'circle-ellipsis'} color={expense.category?.color || '#667085'} />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{expense.description || translatePhrase('Expense')}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatExpenseDate(expense.expenseDate)}
                    {' · '}
                    {translatePhrase(expense.category?.name || 'Uncategorized')}
                    {' · '}
                    {paymentLabel(expense.paymentMethod)}
                  </p>
                  {expense.notes ? <p className="mt-2 text-sm text-muted">{expense.notes}</p> : null}
                </div>
              </div>
              <p className="shrink-0 font-medium text-ink">{formatMoney(expense.amount)}</p>
            </div>
            <div className="mt-3">
              <RowActions expense={expense} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowActions({ expense, onEdit, onDelete }) {
  return (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="secondary"
        fullWidth={false}
        aria-label={`Edit ${expense.description || 'expense'}`}
        onClick={() => onEdit(expense)}
      >
        <Pencil className="size-4" aria-hidden="true" />
        Edit
      </Button>
      <Button
        type="button"
        variant="secondary"
        fullWidth={false}
        aria-label={`Delete ${expense.description || 'expense'}`}
        onClick={() => onDelete(expense)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </Button>
    </div>
  );
}

export function ExpenseListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}
