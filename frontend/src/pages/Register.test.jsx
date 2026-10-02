import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import Register from './Register';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    status: 'ready',
    register: vi.fn(),
  }),
}));

test('register rejects a short password', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );

  await user.type(screen.getByLabelText('Name'), 'Aung Aung');
  await user.type(screen.getByLabelText('Email'), 'aung@example.com');
  await user.type(screen.getByLabelText('Password'), 'short');
  await user.click(screen.getByRole('button', { name: 'Create account' }));

  expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
});
