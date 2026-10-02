import { useState } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import SelectField from '../common/SelectField';
import TextField from '../common/TextField';
import { PAYMENT_METHODS } from '../expenses/paymentMethods';
import { translatePhrase } from '../../i18n';
import { getApiError } from '../../utils/apiError';
import { toDateInputValue, toExpenseInputDate } from '../../utils/dates';

const EMPTY_ERRORS = {};

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function RecurringFormModal({ item, categories, onClose, onSubmit }) {
  const [values, setValues] = useState(() => toFormValues(item));
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const editing = Boolean(item);

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
        frequency: values.frequency,
        nextDate: values.nextDate,
        paymentMethod: values.paymentMethod,
      });
    } catch (error) {
      const apiError = getApiError(error);
      setErrors(apiError.errors);
      setFormError(Object.keys(apiError.errors).length > 0 ? '' : 'Unable to save recurring expense. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit recurring expense' : 'Add recurring expense'} onClose={loading ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="recurring-amount"
          label="Amount"
          inputMode="numeric"
          value={values.amount}
          error={errors.amount}
          onChange={(event) => update('amount', event.target.value)}
        />
        <TextField
          id="recurring-description"
          label="Description"
          value={values.description}
          error={errors.description}
          onChange={(event) => update('description', event.target.value)}
        />
        <SelectField
          id="recurring-category"
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
        <SelectField
          id="recurring-frequency"
          label="Frequency"
          value={values.frequency}
          error={errors.frequency}
          onChange={(event) => update('frequency', event.target.value)}
        >
          {FREQUENCIES.map((frequency) => (
            <option key={frequency.value} value={frequency.value}>
              {frequency.label}
            </option>
          ))}
        </SelectField>
        <TextField
          id="recurring-date"
          label="Next date"
          type="date"
          value={values.nextDate}
          error={errors.nextDate}
          onChange={(event) => update('nextDate', event.target.value)}
        />
        <SelectField
          id="recurring-payment"
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
        {formError ? <p className="text-sm text-danger">{translatePhrase(formError)}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" fullWidth={false} onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth={false} loading={loading}>
            {editing ? 'Save changes' : 'Add recurring expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function toFormValues(item) {
  return {
    amount: item ? String(item.amount) : '',
    description: item?.description || '',
    categoryId: item?.category?.id || '',
    frequency: item?.frequency || 'monthly',
    nextDate: item ? toExpenseInputDate(item.nextDate) : toDateInputValue(),
    paymentMethod: item?.paymentMethod || 'cash',
  };
}

function validate(values) {
  const errors = {};
  const amount = Number(values.amount);

  if (!Number.isInteger(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required';
  }

  if (!values.categoryId) {
    errors.categoryId = 'Category is required';
  }

  if (!values.nextDate) {
    errors.nextDate = 'Date is required';
  }

  return errors;
}
