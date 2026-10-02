import { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SelectField from '../common/SelectField';
import TextField from '../common/TextField';
import { translatePhrase } from '../../i18n';
import { getApiError } from '../../utils/apiError';
import { toDateInputValue, toExpenseInputDate } from '../../utils/dates';
import { PAYMENT_METHODS } from './paymentMethods';

const EMPTY_ERRORS = {};

export default function ExpenseFormModal({ expense, categories, onClose, onSubmit }) {
  const [values, setValues] = useState(() => toFormValues(expense));
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const editing = Boolean(expense);

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
        categoryId: values.categoryId,
        description: values.description.trim(),
        expenseDate: values.expenseDate,
        paymentMethod: values.paymentMethod,
        notes: values.notes.trim(),
      });
    } catch (error) {
      const apiError = getApiError(error);
      setErrors(apiError.errors);
      setFormError(Object.keys(apiError.errors).length > 0 ? '' : 'Unable to save expense. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit expense' : 'Add expense'} onClose={loading ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="expense-amount"
          label="Amount"
          inputMode="numeric"
          value={values.amount}
          error={errors.amount}
          onChange={(event) => update('amount', event.target.value)}
        />
        <SelectField
          id="expense-category"
          label="Category"
          value={values.categoryId}
          error={errors.categoryId}
          onChange={(event) => update('categoryId', event.target.value)}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
        <TextField
          id="expense-description"
          label="Description"
          value={values.description}
          error={errors.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <TextField
          id="expense-date"
          label="Date"
          type="date"
          value={values.expenseDate}
          error={errors.expenseDate}
          onChange={(event) => update('expenseDate', event.target.value)}
        />
        <SelectField
          id="expense-payment"
          label="Payment method"
          value={values.paymentMethod}
          error={errors.paymentMethod}
          onChange={(event) => update('paymentMethod', event.target.value)}
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </SelectField>
        <TextField
          id="expense-notes"
          label="Notes"
          multiline
          value={values.notes}
          error={errors.notes}
          onChange={(event) => update('notes', event.target.value)}
        />
        {formError ? <p className="text-sm text-danger">{translatePhrase(formError)}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} loading={loading}>
            {editing ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function toFormValues(expense) {
  return {
    amount: expense ? String(expense.amount) : '',
    categoryId: expense?.category?.id || '',
    description: expense?.description || '',
    expenseDate: expense ? toExpenseInputDate(expense.expenseDate) : toDateInputValue(),
    paymentMethod: expense?.paymentMethod || 'cash',
    notes: expense?.notes || '',
  };
}

function validate(values) {
  const errors = {};
  const amount = Number(values.amount);

  if (!Number.isInteger(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!values.categoryId) {
    errors.categoryId = 'Category is required';
  }

  if (!values.expenseDate) {
    errors.expenseDate = 'Date is required';
  }

  return errors;
}
