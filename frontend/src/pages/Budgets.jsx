import { useEffect, useState } from 'react';
import { CircleAlert, Pencil, PiggyBank, Plus, Trash2 } from 'lucide-react';
import BudgetFormModal from '../components/budgets/BudgetFormModal';
import BudgetProgressCard from '../components/budgets/BudgetProgressCard';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import { useToast } from '../hooks/useToast';
import { createBudget, deleteBudget, listBudgets, updateBudget } from '../services/budgetApi';
import { translatePhrase } from '../i18n';
import { listCategories } from '../services/categoryApi';

export default function Budgets() {
  const { notify } = useToast();
  const [period, setPeriod] = useState(currentPeriod);
  const [status, setStatus] = useState('loading');
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formBudget, setFormBudget] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    listBudgets({ month: period.month, year: period.year })
      .then((data) => {
        if (!ignore) {
          setBudgets(data.budgets);
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
  }, [period.month, period.year, requestId]);

  useEffect(() => {
    let ignore = false;

    listCategories()
      .then((items) => {
        if (!ignore) {
          setCategories(items);
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
    if (formBudget) {
      await updateBudget(formBudget.id, payload);
      notify('Budget updated successfully.');
    } else {
      await createBudget(payload);
      notify('Budget added successfully.');
    }

    setFormBudget(undefined);
    setPeriod({ month: payload.month, year: payload.year });
    reload();
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteBudget(pendingDelete.id);
      notify('Budget deleted successfully.');
      setPendingDelete(null);
      reload();
    } catch {
      notify('Unable to delete budget. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SectionPage
      icon={PiggyBank}
      title="Budgets"
      description="Set a monthly limit and see how much is left."
      action={(
        <Button type="button" fullWidth={false} onClick={() => setFormBudget(null)}>
          <Plus className="size-4" aria-hidden="true" />
          Add budget
        </Button>
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="secondary" fullWidth={false} onClick={() => setPeriod(shiftPeriod(period, -1))} disabled={period.year <= 2000 && period.month === 1}>
          Previous
        </Button>
        <p className="text-sm font-medium text-ink">{translatePhrase(periodLabel(period))}</p>
        <Button type="button" variant="secondary" fullWidth={false} onClick={() => setPeriod(shiftPeriod(period, 1))} disabled={period.year >= 2100 && period.month === 12}>
          Next
        </Button>
      </div>

      <div className="mt-6">
        {status === 'loading' ? (
          <div className="grid gap-3 lg:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-lg border border-border bg-surface" />
            ))}
          </div>
        ) : null}
        {status === 'error' ? (
          <EmptyState icon={CircleAlert} title="Unable to load budgets" description="Check your connection and try again.">
            <Button type="button" fullWidth={false} onClick={reload}>Try again</Button>
          </EmptyState>
        ) : null}
        {status === 'ready' && budgets.length === 0 ? (
          <EmptyState icon={PiggyBank} title="No budgets for this month" description="Set a limit to track how much you have left to spend.">
            <Button type="button" fullWidth={false} onClick={() => setFormBudget(null)}>Add budget</Button>
          </EmptyState>
        ) : null}
        {status === 'ready' && budgets.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {budgets.map((budget) => (
              <BudgetProgressCard
                key={budget.id}
                budget={budget}
                actions={(
                  <>
                    <Button type="button" variant="secondary" fullWidth={false} aria-label={`Edit ${budget.category?.name || 'overall'} budget`} onClick={() => setFormBudget(budget)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button type="button" variant="secondary" fullWidth={false} aria-label={`Delete ${budget.category?.name || 'overall'} budget`} onClick={() => setPendingDelete(budget)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </>
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {formBudget !== undefined ? (
        <BudgetFormModal
          budget={formBudget}
          categories={categories}
          period={period}
          onClose={() => setFormBudget(undefined)}
          onSubmit={handleSubmit}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this budget?"
          description="Your expenses will stay. This only removes the spending limit."
          loading={deleting}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </SectionPage>
  );
}

function currentPeriod() {
  const now = new Date();
  return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
}

function shiftPeriod(period, delta) {
  const date = new Date(Date.UTC(period.year, period.month - 1 + delta, 1));
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

function periodLabel(period) {
  return new Date(Date.UTC(period.year, period.month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
