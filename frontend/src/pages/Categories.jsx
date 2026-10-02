import { useCallback, useEffect, useState } from 'react';
import { CircleAlert, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import CategoryFormModal from '../components/categories/CategoryFormModal';
import CategoryIcon from '../components/categories/CategoryIcon';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import { useToast } from '../hooks/useToast';
import { createCategory, deleteCategory, getCategoryOverview, updateCategory } from '../services/categoryApi';
import { translatePhrase } from '../i18n';
import { formatMoney } from '../utils/currency';

export default function Categories() {
  const { notify } = useToast();
  const [status, setStatus] = useState('loading');
  const [categories, setCategories] = useState([]);
  const [uncategorizedSpent, setUncategorizedSpent] = useState(0);
  const [formCategory, setFormCategory] = useState(undefined);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [requestId, setRequestId] = useState(0);

  const reload = useCallback(() => {
    setStatus('loading');
    setRequestId((value) => value + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    getCategoryOverview()
      .then((data) => {
        if (!ignore) {
          setCategories(data.categories);
          setUncategorizedSpent(data.uncategorizedSpent);
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

  async function handleSubmit(payload) {
    if (formCategory) {
      await updateCategory(formCategory.id, payload);
      notify('Category updated successfully.');
    } else {
      await createCategory(payload);
      notify('Category added successfully.');
    }

    setFormCategory(undefined);
    reload();
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteCategory(pendingDelete.id);
      notify('Category deleted successfully.');
      setPendingDelete(null);
      reload();
    } catch {
      notify('Unable to delete category. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SectionPage
      icon={Tags}
      title="Categories"
      description="Group spending so reports stay easy to read."
      action={(
        <Button type="button" fullWidth={false} onClick={() => setFormCategory(null)}>
          <Plus className="size-4" aria-hidden="true" />
          Add category
        </Button>
      )}
    >
      {status === 'loading' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      ) : null}
      {status === 'error' ? (
        <EmptyState icon={CircleAlert} title="Unable to load categories" description="Check your connection and try again.">
          <Button type="button" fullWidth={false} onClick={reload}>Try again</Button>
        </EmptyState>
      ) : null}
      {status === 'ready' && categories.length === 0 && uncategorizedSpent === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Add a category to group your spending.">
          <Button type="button" fullWidth={false} onClick={() => setFormCategory(null)}>Add category</Button>
        </EmptyState>
      ) : null}
      {status === 'ready' && (categories.length > 0 || uncategorizedSpent > 0) ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon name={category.icon} color={category.color} />
                  <div>
                    <h2 className="font-medium text-ink">{translatePhrase(category.name)}</h2>
                    <p className="mt-1 text-sm text-muted">{translatePhrase(`Spent ${formatMoney(category.spent)}`)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  aria-label={`Edit ${category.name}`}
                  onClick={() => setFormCategory(category)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth={false}
                  aria-label={`Delete ${category.name}`}
                  onClick={() => setPendingDelete(category)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
          {uncategorizedSpent > 0 ? (
            <article className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <CategoryIcon name="circle-ellipsis" color="#667085" />
                <div>
                  <h2 className="font-medium text-ink">{translatePhrase('Uncategorized')}</h2>
                  <p className="mt-1 text-sm text-muted">{translatePhrase('Expenses whose category was deleted.')}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted">{translatePhrase(`Spent ${formatMoney(uncategorizedSpent)}`)}</p>
            </article>
          ) : null}
        </div>
      ) : null}

      {formCategory !== undefined ? (
        <CategoryFormModal
          category={formCategory}
          onClose={() => setFormCategory(undefined)}
          onSubmit={handleSubmit}
        />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this category?"
          description="Existing expenses will stay in your history without this category."
          loading={deleting}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </SectionPage>
  );
}
