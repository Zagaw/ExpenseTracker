import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test } from 'vitest';
import MobileNav from './MobileNav';

test('the mobile navigation stays available on small screens', () => {
  render(
    <MemoryRouter>
      <MobileNav menuOpen={false} onOpenMenu={() => {}} />
    </MemoryRouter>,
  );

  const navigation = screen.getByRole('navigation', { name: 'Primary' });
  expect(navigation.className).toContain('lg:hidden');
  expect(screen.getByText('Home')).toBeTruthy();
  expect(screen.getByText('Expenses')).toBeTruthy();
  expect(screen.getByText('Budgets')).toBeTruthy();
  expect(screen.getByText('Reports')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Menu' })).toBeTruthy();
});
