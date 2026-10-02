import { createElement, useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import TextField from '../common/TextField';
import { translatePhrase } from '../../i18n';
import { getApiError } from '../../utils/apiError';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './categoryIcons';

const EMPTY_ERRORS = {};

export default function CategoryFormModal({ category, onClose, onSubmit }) {
  const [values, setValues] = useState(() => ({
    name: category?.name || '',
    icon: category?.icon || 'circle-ellipsis',
    color: category?.color || CATEGORY_COLORS[0],
  }));
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const editing = Boolean(category);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Category name is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('');
      return;
    }

    setLoading(true);
    setErrors(EMPTY_ERRORS);
    setFormError('');

    try {
      await onSubmit({
        name: values.name.trim(),
        icon: values.icon,
        color: values.color,
      });
    } catch (error) {
      const apiError = getApiError(error);
      setErrors(apiError.errors);
      setFormError(Object.keys(apiError.errors).length > 0
        ? ''
        : (apiError.message === 'Something went wrong. Please try again.'
          ? 'Unable to save category. Please try again.'
          : apiError.message));
      setLoading(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit category' : 'Add category'} onClose={loading ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="category-name"
          label="Name"
          value={values.name}
          error={errors.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        />
        <fieldset>
          <legend className="text-sm font-medium text-ink">{translatePhrase('Icon')}</legend>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {CATEGORY_ICONS.map((item) => {
              const selected = values.icon === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  aria-label={translatePhrase(item.label)}
                  aria-pressed={selected}
                  className={`inline-flex h-10 items-center justify-center rounded-md border ${selected ? 'border-primary bg-primary-light text-primary' : 'border-border text-ink'}`}
                  onClick={() => setValues((current) => ({ ...current, icon: item.value }))}
                >
                  {createElement(item.icon, { className: 'size-4', 'aria-hidden': true })}
                </button>
              );
            })}
          </div>
          {errors.icon ? <p className="mt-1 text-sm text-danger">{translatePhrase(errors.icon)}</p> : null}
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium text-ink">{translatePhrase('Color')}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={translatePhrase(`Color ${color}`)}
                aria-pressed={values.color.toUpperCase() === color}
                className={`size-8 rounded-md border ${values.color.toUpperCase() === color ? 'border-ink' : 'border-border'}`}
                style={{ backgroundColor: color }}
                onClick={() => setValues((current) => ({ ...current, color }))}
              />
            ))}
            <label className="inline-flex items-center gap-2 text-sm text-muted">
              {translatePhrase('Custom')}
              <input
                id="category-color"
                aria-label={translatePhrase('Custom color')}
                type="color"
                value={values.color}
                onChange={(event) => setValues((current) => ({ ...current, color: event.target.value.toUpperCase() }))}
              />
            </label>
          </div>
          {errors.color ? <p className="mt-1 text-sm text-danger">{translatePhrase(errors.color)}</p> : null}
        </fieldset>
        {formError ? <p className="text-sm text-danger">{translatePhrase(formError)}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} loading={loading}>
            {editing ? 'Save changes' : 'Add category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
