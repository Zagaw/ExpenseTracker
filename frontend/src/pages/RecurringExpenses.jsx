import { useEffect, useState } from 'react';
import { CircleAlert, CircleEllipsis, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import CategoryIcon from '../components/categories/CategoryIcon';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import RecurringFormModal from '../components/recurring/RecurringFormModal';
import { translatePhrase } from '../i18n';
import { paymentLabel } from '../components/expenses/paymentMethods';
import { useToast } from '../hooks/useToast';
import { listCategories } from '../services/categoryApi';
import {
  createRecurringExpense,
  deleteRecurringExpense,
  listRecurringExpenses,
  toggleRecurringExpense,
  updateRecurringExpense,
} from '../services/recurringExpenseApi';
import { formatMoney } from '../utils/currency';
import { formatExpenseDate } from '../utils/dates';

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function RecurringExpenses() {
  const { notify } = useToast();
  const [status, setStatus] = useState('loading');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formItem, setFormItem] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState('');
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    listRecurringExpenses()
      .then((recurringExpenses) => {
        if (!ignore) {
          setItems(recurringExpenses);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  useEffect(() => {
    let ignore = false;

    listCategories()
      .then((nextCategories) => {
        if (!ignore) {
          setCategories(nextCategories);
        }
      })
      .catch(() => {
        if (!ignore) {
          setCategories([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  function reload() {
    setStatus('loading');
    setRequestId((value) => value + 1);
  }

  async function handleSubmit(payload) {
    if (formItem) {
      await updateRecurringExpense(formItem.id, payload);
      notify('Recurring expense updated.');
    } else {
      await createRecurringExpense(payload);
      notify('Recurring expense added.');
    }

    setFormItem(undefined);
    reload();
  }

  async function handleToggle(item) {
    setTogglingId(item.id);

    try {
      await toggleRecurringExpense(item.id);
      notify(item.active ? 'Recurring expense paused.' : 'Recurring expense resumed.');
      reload();
    } catch {
      notify('Unable to update recurring expense. Please try again.', 'error');
    } finally {
      setTogglingId('');
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteRecurringExpense(pendingDelete.id);
      notify('Recurring expense deleted.');
      setPendingDelete(null);
      reload();
    } catch {
      notify('Unable to delete recurring expense. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SectionPage
      icon={Repeat}
      title="Recurring expenses"
      description="Bills and other costs that repeat. When one is due, it is added to your expenses."
      action={(
        <Button type="button" fullWidth={false} onClick={() => setFormItem(null)}>
          <Plus className="size-4" aria-hidden="true" />
          Add recurring expense
        </Button>
      )}
    >
      {status === 'loading' ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      ) : null}
      {status === 'error' ? (
        <EmptyState icon={CircleAlert} title="Unable to load recurring expenses" description="Check your connection and try again.">
          <Button type="button" fullWidth={false} onClick={reload}>Try again</Button>
        </EmptyState>
      ) : null}
      {status === 'ready' && items.length === 0 ? (
        <EmptyState icon={Repeat} title="No recurring expenses yet" description="Add rent, bills, or anything else that repeats.">
          <Button type="button" fullWidth={false} onClick={() => setFormItem(null)}>Add recurring expense</Button>
        </EmptyState>
      ) : null}
      {status === 'ready' && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                {item.category ? (
                  <CategoryIcon name={item.category.icon} color={item.category.color} label={translatePhrase(item.category.name)} />
                ) : (
                  <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary-light text-muted" aria-hidden="true">
                    <CircleEllipsis className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-medium text-ink">{item.description}</h2>
                    <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                      {translatePhrase(item.active ? 'Active' : 'Paused')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink">{formatMoney(item.amount)}</p>
                  <p className="mt-1 text-sm text-muted">
                    {translatePhrase(FREQUENCY_LABELS[item.frequency] || item.frequency)}
                    {' · '}
                    {translatePhrase(`Next ${formatExpenseDate(item.nextDate)}`)}
                    {' · '}
                    {paymentLabel(item.paymentMethod)}
                    {item.category ? ` · ${translatePhrase(item.category.name)}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  loading={togglingId === item.id}
                  onClick={() => handleToggle(item)}
                >
                  {item.active ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  aria-label={`Edit ${item.description}`}
                  onClick={() => setFormItem(item)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  aria-label={`Delete ${item.description}`}
                  onClick={() => setPendingDelete(item)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {formItem !== undefined ? (
        <RecurringFormModal
          item={formItem}
          categories={categories}
          onClose={() => setFormItem(undefined)}
          onSubmit={handleSubmit}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this recurring expense?"
          description="Expenses already added will stay. This only removes the schedule."
          loading={deleting}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </SectionPage>
  );
}
