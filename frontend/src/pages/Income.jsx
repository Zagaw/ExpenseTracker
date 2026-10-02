import { useState } from 'react';
import { CircleAlert, Plus, Search, Wallet } from 'lucide-react';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import IncomeFilters from '../components/income/IncomeFilters';
import IncomeFormModal from '../components/income/IncomeFormModal';
import IncomeList, { IncomeListSkeleton } from '../components/income/IncomeList';
import { useDebounce } from '../hooks/useDebounce';
import { useIncome } from '../hooks/useIncome';
import { useToast } from '../hooks/useToast';
import { createIncome, deleteIncome, updateIncome } from '../services/incomeApi';
import { pageLabel, translatePhrase } from '../i18n';
import { formatMoney } from '../utils/currency';

export default function Income() {
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [page, setPage] = useState(1);
  const [formIncome, setFormIncome] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (appliedSearch !== debouncedSearch) {
    setAppliedSearch(debouncedSearch);
    setPage(1);
  }

  const { status, income, total, totalAmount, limit, reload } = useIncome({
    search: appliedSearch || undefined,
    from: from || undefined,
    to: to || undefined,
    sort,
    page,
    limit: 20,
  });

  const hasFilters = Boolean(appliedSearch || from || to);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  async function handleSubmit(payload) {
    if (formIncome) {
      await updateIncome(formIncome.id, payload);
      notify('Income updated successfully.');
    } else {
      await createIncome(payload);
      notify('Income added successfully.');
    }

    setFormIncome(undefined);
    reload();
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteIncome(pendingDelete.id);
      notify('Income deleted successfully.');
      setPendingDelete(null);

      if (income.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        reload();
      }
    } catch {
      notify('Unable to delete income. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SectionPage
      icon={Wallet}
      title="Income"
      description="Record money coming in."
      action={(
        <Button type="button" fullWidth={false} onClick={() => setFormIncome(null)}>
          <Plus className="size-4" aria-hidden="true" />
          Add income
        </Button>
      )}
    >
      <IncomeFilters
        search={search}
        from={from}
        to={to}
        sort={sort}
        onSearchChange={setSearch}
        onFromChange={(value) => changeFilter(setFrom, value)}
        onToChange={(value) => changeFilter(setTo, value)}
        onSortChange={(value) => changeFilter(setSort, value)}
      />

      {status === 'ready' ? (
        <p className="mt-6 text-sm text-muted">
          {translatePhrase(hasFilters ? 'Matching income' : 'Total income')}
          <span className="ml-2 text-base font-semibold text-ink">{formatMoney(totalAmount)}</span>
        </p>
      ) : null}

      <div className="mt-6">
        {status === 'loading' ? <IncomeListSkeleton /> : null}
        {status === 'error' ? (
          <EmptyState icon={CircleAlert} title="Unable to load income" description="Check your connection and try again.">
            <Button type="button" fullWidth={false} onClick={reload}>
              Try again
            </Button>
          </EmptyState>
        ) : null}
        {status === 'ready' && income.length === 0 && !hasFilters ? (
          <EmptyState
            icon={Wallet}
            title="No income yet"
            description="Record money coming in by adding your first income."
          >
            <Button type="button" fullWidth={false} onClick={() => setFormIncome(null)}>
              Add income
            </Button>
          </EmptyState>
        ) : null}
        {status === 'ready' && income.length === 0 && hasFilters ? (
          <EmptyState
            icon={Search}
            title="No matching income"
            description="Try a different search or date range."
          />
        ) : null}
        {status === 'ready' && income.length > 0 ? (
          <IncomeList income={income} onEdit={setFormIncome} onDelete={setPendingDelete} />
        ) : null}
      </div>

      {status === 'ready' && total > limit ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {pageLabel(page, totalPages)}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" fullWidth={false} disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button type="button" variant="secondary" fullWidth={false} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {formIncome !== undefined ? (
        <IncomeFormModal
          income={formIncome}
          onClose={() => setFormIncome(undefined)}
          onSubmit={handleSubmit}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this income?"
          description="This action cannot be undone."
          loading={deleting}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </SectionPage>
  );
}
