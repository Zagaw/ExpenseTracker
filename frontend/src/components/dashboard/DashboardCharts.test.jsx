import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import DashboardCharts from './DashboardCharts';

const emptyCharts = {
  spendingTrend: [{ month: '2026-10', label: 'Oct', amount: 0 }],
  categories: [],
  incomeVsExpenses: [{ month: '2026-10', label: 'Oct', income: 0, expenses: 0 }],
};

test('charts explain when there is nothing to draw', () => {
  render(<DashboardCharts charts={emptyCharts} />);

  expect(screen.getByText('No spending in the last 6 months.')).toBeTruthy();
  expect(screen.getByText('No spending this month.')).toBeTruthy();
  expect(screen.getByText('No income or expenses in the last 6 months.')).toBeTruthy();
});

test('charts keep category amounts available as text', () => {
  render(
    <DashboardCharts
      charts={{
        ...emptyCharts,
        spendingTrend: [{ month: '2026-10', label: 'Oct', amount: 15000 }],
        categories: [{ name: 'Food', amount: 15000, color: '#0F766E' }],
      }}
    />,
  );

  expect(document.body.textContent).toContain('Food');
  expect(document.body.textContent).toContain('15,000 MMK');
  expect(screen.queryByText('No spending this month.')).toBeNull();
});
