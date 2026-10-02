import { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SelectField from '../common/SelectField';
import TextField from '../common/TextField';
import { translatePhrase } from '../../i18n';
import { getApiError } from '../../utils/apiError';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const EMPTY_ERRORS = {};

export default function BudgetFormModal({ budget, categories, period, onClose, onSubmit }) {
  const [values, setValues] = useState(() => ({
    amount: budget ? String(budget.amount) : '',
    categoryId: budget?.category?.id || '',
    month: String(budget?.month || period.month),
    year: String(budget?.year || period.year),
  }));
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const editing = Boolean(budget);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);

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
        amount: Number(values.amount),
        categoryId: values.categoryId || null,
        month: Number(values.month),
        year: Number(values.year),
      });
    } catch (error) {
      const apiError = getApiError(error);
      setErrors(apiError.errors);
      setFormError(Object.keys(apiError.errors).length > 0
        ? ''
        : (apiError.message === 'Something went wrong. Please try again.'
          ? 'Unable to save budget. Please try again.'
          : apiError.message));
      setLoading(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit budget' : 'Add budget'} onClose={loading ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="budget-amount"
          label="Amount"
          inputMode="numeric"
          value={values.amount}
          error={errors.amount}
          onChange={(event) => update('amount', event.target.value)}
        />
        <SelectField
          id="budget-category"
          label="Category"
          value={values.categoryId}
          error={errors.categoryId}
          onChange={(event) => update('categoryId', event.target.value)}
        >
          <option value="">Overall monthly budget</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </SelectField>
        <SelectField
          id="budget-month"
          label="Month"
          value={values.month}
          error={errors.month}
          onChange={(event) => update('month', event.target.value)}
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>{name}</option>
          ))}
        </SelectField>
        <TextField
          id="budget-year"
          label="Year"
          inputMode="numeric"
          value={values.year}
          error={errors.year}
          onChange={(event) => update('year', event.target.value)}
        />
        {formError ? <p className="text-sm text-danger">{translatePhrase(formError)}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} loading={loading}>
            {editing ? 'Save changes' : 'Add budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function validate(values) {
  const errors = {};
  const amount = Number(values.amount);
  const year = Number(values.year);

  if (!Number.isInteger(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    errors.year = 'Year is not valid';
  }

  return errors;
}
