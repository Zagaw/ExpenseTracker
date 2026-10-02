import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import ExpenseFormModal from './ExpenseFormModal';

const categories = [{ id: 'food-id', name: 'Food' }];

test('the expense form blocks an incomplete expense', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ExpenseFormModal categories={categories} onClose={() => {}} onSubmit={onSubmit} />);

  await user.clear(screen.getByLabelText('Date'));
  await user.click(screen.getByRole('button', { name: 'Add expense' }));

  expect(screen.getByText('Amount must be greater than 0')).toBeTruthy();
  expect(screen.getByText('Category is required')).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

test('the expense form submits the entered expense without a user id', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<ExpenseFormModal categories={categories} onClose={() => {}} onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Amount'), '15000');
  await user.selectOptions(screen.getByLabelText('Category'), 'food-id');
  await user.type(screen.getByLabelText('Description'), 'Market lunch');
  await user.click(screen.getByRole('button', { name: 'Add expense' }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    amount: 15000,
    categoryId: 'food-id',
    description: 'Market lunch',
    paymentMethod: 'cash',
  }));
  expect(onSubmit.mock.calls[0][0].userId).toBeUndefined();
});
