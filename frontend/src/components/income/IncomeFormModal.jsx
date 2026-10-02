import { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import TextField from '../common/TextField';
import { translatePhrase } from '../../i18n';
import { getApiError } from '../../utils/apiError';
import { toDateInputValue, toExpenseInputDate } from '../../utils/dates';

const EMPTY_ERRORS = {};

export default function IncomeFormModal({ income, onClose, onSubmit }) {
  const [values, setValues] = useState(() => toFormValues(income));
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const editing = Boolean(income);

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
        source: values.source.trim(),
        description: values.description.trim(),
        incomeDate: values.incomeDate,
      });
    } catch (error) {
      const apiError = getApiError(error);
      setErrors(apiError.errors);
      setFormError(Object.keys(apiError.errors).length > 0 ? '' : 'Unable to save income. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit income' : 'Add income'} onClose={loading ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="income-amount"
          label="Amount"
          inputMode="numeric"
          value={values.amount}
          error={errors.amount}
          onChange={(event) => update('amount', event.target.value)}
        />
        <TextField
          id="income-source"
          label="Source"
          value={values.source}
          error={errors.source}
          onChange={(event) => update('source', event.target.value)}
        />
        <TextField
          id="income-description"
          label="Description"
          value={values.description}
          error={errors.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <TextField
          id="income-date"
          label="Date"
          type="date"
          value={values.incomeDate}
          error={errors.incomeDate}
          onChange={(event) => update('incomeDate', event.target.value)}
        />
        {formError ? <p className="text-sm text-danger">{translatePhrase(formError)}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} loading={loading}>
            {editing ? 'Save changes' : 'Add income'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function toFormValues(income) {
  return {
    amount: income ? String(income.amount) : '',
    source: income?.source || '',
    description: income?.description || '',
    incomeDate: income ? toExpenseInputDate(income.incomeDate) : toDateInputValue(),
  };
}

function validate(values) {
  const errors = {};
  const amount = Number(values.amount);

  if (!Number.isInteger(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!values.source.trim()) {
    errors.source = 'Source is required';
  }

  if (!values.incomeDate) {
    errors.incomeDate = 'Date is required';
  }

  return errors;
}
