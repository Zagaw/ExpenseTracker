import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Dashboard from './Dashboard';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { fullName: 'Aung Aung' }, status: 'ready' }),
}));

vi.mock('../services/dashboardApi', () => ({
  getDashboard: vi.fn(),
}));

test('the dashboard shows an error state when the summary cannot load', async () => {
  const { getDashboard } = await import('../services/dashboardApi');
  getDashboard.mockRejectedValue(new Error('offline'));

  render(<Dashboard />);

  expect(await screen.findByText('Unable to load your financial overview')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
});
