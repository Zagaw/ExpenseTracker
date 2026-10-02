import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import ExpenseFilters from './ExpenseFilters';

test('expense filters report search, category, and payment changes', async () => {
  const user = userEvent.setup();
  const onSearchChange = vi.fn();
  const onCategoryChange = vi.fn();
  const onPaymentMethodChange = vi.fn();

  render(
    <ExpenseFilters
      search=""
      category=""
      from=""
      to=""
      paymentMethod=""
      sort="date_desc"
      categories={[{ id: 'food-id', name: 'Food' }]}
      onSearchChange={onSearchChange}
      onCategoryChange={onCategoryChange}
      onFromChange={() => {}}
      onToChange={() => {}}
      onPaymentMethodChange={onPaymentMethodChange}
      onSortChange={() => {}}
    />,
  );

  await user.type(screen.getByLabelText('Search'), 'taxi');
  await user.selectOptions(screen.getByLabelText('Category'), 'food-id');
  await user.selectOptions(screen.getByLabelText('Payment method'), 'card');

  expect(onSearchChange).toHaveBeenCalled();
  expect(onCategoryChange).toHaveBeenCalledWith('food-id');
  expect(onPaymentMethodChange).toHaveBeenCalledWith('card');
});
