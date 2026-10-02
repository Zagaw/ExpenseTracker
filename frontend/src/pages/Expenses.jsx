import { useEffect, useState } from 'react';
import { CircleAlert, Download, Plus, Receipt, Search } from 'lucide-react';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import ExpenseFilters from '../components/expenses/ExpenseFilters';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal';
import ExpenseList, { ExpenseListSkeleton } from '../components/expenses/ExpenseList';
import { useDebounce } from '../hooks/useDebounce';
import { useExpenses } from '../hooks/useExpenses';
import { useToast } from '../hooks/useToast';
import { pageLabel } from '../i18n';
import { listCategories } from '../services/categoryApi';
import { createExpense, deleteExpense, exportExpenses, updateExpense } from '../services/expenseApi';

export default function Expenses() {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [formExpense, setFormExpense] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (appliedSearch !== debouncedSearch) {
    setAppliedSearch(debouncedSearch);
    setPage(1);
  }

  const { status, expenses, total, limit, reload } = useExpenses({
    search: appliedSearch || undefined,
    category: category || undefined,
    from: from || undefined,
    to: to || undefined,
    paymentMethod: paymentMethod || undefined,
    sort,
    page,
    limit: 20,
  });

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

  const hasFilters = Boolean(appliedSearch || category || from || to || paymentMethod);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  async function handleSubmit(payload) {
    if (formExpense) {
      await updateExpense(formExpense.id, payload);
      notify('Expense updated successfully.');
    } else {
      await createExpense(payload);
      notify('Expense added successfully.');
    }

    setFormExpense(undefined);
    reload();
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteExpense(pendingDelete.id);
      notify('Expense deleted successfully.');
      setPendingDelete(null);

      if (expenses.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch {
      notify('Unable to delete expense. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    setExporting(true);

    try {
      await exportExpenses({
        search: appliedSearch || undefined,
        category: category || undefined,
        from: from || undefined,
        to: to || undefined,
        paymentMethod: paymentMethod || undefined,
        sort,
      });
      notify('Expenses exported.');
    } catch {
      notify('Unable to export expenses. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <SectionPage
      icon={Receipt}
      title="Expenses"
      description="Record and review money going out."
      action={(
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" fullWidth={false} loading={exporting} onClick={handleExport}>
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </Button>
          <Button type="button" fullWidth={false} onClick={() => setFormExpense(null)}>
            <Plus className="size-4" aria-hidden="true" />
            Add expense
          </Button>
        </div>
      )}
    >
      <ExpenseFilters
        search={search}
        category={category}
        from={from}
        to={to}
        paymentMethod={paymentMethod}
        sort={sort}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={(value) => changeFilter(setCategory, value)}
        onFromChange={(value) => changeFilter(setFrom, value)}
        onToChange={(value) => changeFilter(setTo, value)}
        onPaymentMethodChange={(value) => changeFilter(setPaymentMethod, value)}
        onSortChange={(value) => changeFilter(setSort, value)}
      />

      <div className="mt-6">
        {status === 'loading' ? <ExpenseListSkeleton /> : null}
        {status === 'error' ? (
          <EmptyState
            icon={CircleAlert}
            title="Unable to load expenses"
            description="Check your connection and try again."
          >
            <Button type="button" fullWidth={false} onClick={reload}>
              Try again
            </Button>
          </EmptyState>
        ) : null}
        {status === 'ready' && expenses.length === 0 && !hasFilters ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Start tracking your spending by adding your first expense."
          >
            <Button type="button" fullWidth={false} onClick={() => setFormExpense(null)}>
              Add expense
            </Button>
          </EmptyState>
        ) : null}
        {status === 'ready' && expenses.length === 0 && hasFilters ? (
          <EmptyState
            icon={Search}
            title="No matching expenses"
            description="Try a different search, category, date, or payment method."
          />
        ) : null}
        {status === 'ready' && expenses.length > 0 ? (
          <ExpenseList
            expenses={expenses}
            onEdit={setFormExpense}
            onDelete={setPendingDelete}
          />
        ) : null}
      </div>

      {status === 'ready' && total > limit ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {pageLabel(page, totalPages)}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {formExpense !== undefined ? (
        <ExpenseFormModal
          expense={formExpense}
          categories={categories}
          onClose={() => setFormExpense(undefined)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this expense?"
          description="This action cannot be undone."
          loading={deleting}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </SectionPage>
  );
}
