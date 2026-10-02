import api from './api';

export async function getReport(params) {
  const [monthly, categories, trends] = await Promise.all([
    api.get('/reports/monthly', { params }),
    api.get('/reports/categories', { params }),
    api.get('/reports/trends', { params }),
  ]);

  return {
    period: monthly.data.data.period,
    summary: monthly.data.data.summary,
    categories: categories.data.data.categories,
    categoryTotal: categories.data.data.total,
    grain: trends.data.data.grain,
    spendingTrend: trends.data.data.spendingTrend,
    incomeVsExpenses: trends.data.data.incomeVsExpenses,
  };
}
