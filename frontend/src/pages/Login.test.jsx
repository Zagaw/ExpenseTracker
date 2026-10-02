import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, test, vi } from 'vitest';
import Login from './Login';

const { login } = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    status: 'ready',
    login,
  }),
}));

beforeEach(() => {
  login.mockReset();
});

test('login requires an email and password before calling the API', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(screen.getByText('Email is required')).toBeTruthy();
  expect(screen.getByText('Password is required')).toBeTruthy();
  expect(login).not.toHaveBeenCalled();
});

test('login shows the API error and does not navigate', async () => {
  login.mockRejectedValue({ response: { data: { message: 'Email or password is incorrect.' } } });
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

  await user.type(screen.getByLabelText('Email'), 'aung@example.com');
  await user.type(screen.getByLabelText('Password'), 'correct-password');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Email or password is incorrect.');
  expect(login).toHaveBeenCalledWith({ email: 'aung@example.com', password: 'correct-password' });
});
