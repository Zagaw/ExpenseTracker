import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import GuestRoute from './GuestRoute';
import ProtectedRoute from './ProtectedRoute';

const { authState } = vi.hoisted(() => ({
  authState: { user: null, status: 'ready' },
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => authState,
}));

test('protected pages send a signed-out visitor to login', () => {
  authState.user = null;
  authState.status = 'ready';

  render(
    <MemoryRouter initialEntries={['/expenses']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/expenses" element={<p>Private expenses</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Login page')).toBeTruthy();
  expect(screen.queryByText('Private expenses')).toBeNull();
});

test('a signed-in visitor can open a protected page', () => {
  authState.user = { fullName: 'Aung Aung' };
  authState.status = 'ready';

  render(
    <MemoryRouter initialEntries={['/expenses']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/expenses" element={<p>Private expenses</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Private expenses')).toBeTruthy();
});

test('a signed-in visitor is kept out of the login page', () => {
  authState.user = { fullName: 'Aung Aung' };
  authState.status = 'ready';

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<p>Login page</p>} />
        </Route>
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText('Dashboard page')).toBeTruthy();
});
