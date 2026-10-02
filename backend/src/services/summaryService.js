import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { Income } from '../models/Income.js';
import { requireUserId } from '../utils/ownership.js';
import { budgetService } from './budgetService.js';
import { insightService } from './insightService.js';
import { recurringExpenseService } from './recurringExpenseService.js';

const TREND_MONTHS = 6;
const RECENT_LIMIT = 5;

export async function getDashboard(userId) {
  const ownerId = requireUserId(userId);
  await recurringExpenseService.processDue(ownerId);
  const months = recentMonths(TREND_MONTHS);
  const current = months[months.length - 1];
  const rangeStart = months[0].start;

  const budgetPeriodPromise = budgetService.listWithProgress(ownerId, {});
  const [
    totalIncome,
    totalExpenses,
    expenseMonths,
    incomeMonths,
    categoryRows,
    recentExpenses,
    recentIncome,
    budgetPeriod,
    insights,
  ] = await Promise.all([
    totalAmount(Income, ownerId),
    totalAmount(Expense, ownerId),
    totalsByMonth(Expense, ownerId, 'expenseDate', rangeStart, current.end),
    totalsByMonth(Income, ownerId, 'incomeDate', rangeStart, current.end),
    categoryTotals(ownerId, current.start, current.end),
    Expense.find({ userId: ownerId })
      .sort({ expenseDate: -1, createdAt: -1 })
      .limit(RECENT_LIMIT)
      .populate('categoryId', 'name')
      .lean(),
    Income.find({ userId: ownerId })
      .sort({ incomeDate: -1, createdAt: -1 })
      .limit(RECENT_LIMIT)
      .lean(),
    budgetPeriodPromise,
    budgetPeriodPromise.then((period) => insightService.list(ownerId, { budgetPeriod: period })),
  ]);

  const monthlyExpenses = expenseMonths.get(current.key) ?? 0;
  const dayOfMonth = new Date().getUTCDate();
  const top = categoryRows[0];

  return {
    summary: {
      balance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      monthlyExpenses,
      averageDailySpending: monthlyExpenses === 0 ? 0 : Math.round(monthlyExpenses / dayOfMonth),
      topCategory: top ? { name: top.name, amount: top.amount } : null,
    },
    charts: {
      spendingTrend: months.map((month) => ({
        month: month.key,
        label: month.label,
        amount: expenseMonths.get(month.key) ?? 0,
      })),
      categories: categoryRows.map((row) => ({
        name: row.name,
        amount: row.amount,
        color: row.color,
      })),
      incomeVsExpenses: months.map((month) => ({
        month: month.key,
        label: month.label,
        income: incomeMonths.get(month.key) ?? 0,
        expenses: expenseMonths.get(month.key) ?? 0,
      })),
    },
    transactions: [...recentExpenses.map(serializeExpense), ...recentIncome.map(serializeIncome)]
      .sort(byNewest)
      .slice(0, RECENT_LIMIT)
      .map(({ createdAt, ...transaction }) => transaction),
    budgets: budgetPeriod.budgets,
    insights,
  };
}

async function totalAmount(Model, userId) {
  const [row] = await Model.aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return row?.total ?? 0;
}

async function totalsByMonth(Model, userId, field, start, end) {
  const rows = await Model.aggregate([
    { $match: { userId, [field]: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { year: { $year: `$${field}` }, month: { $month: `$${field}` } },
        amount: { $sum: '$amount' },
      },
    },
  ]);
  const totals = new Map();

  for (const row of rows) {
    totals.set(`${row._id.year}-${String(row._id.month).padStart(2, '0')}`, row.amount);
  }

  return totals;
}

async function categoryTotals(userId, start, end) {
  const rows = await Expense.aggregate([
    { $match: { userId, expenseDate: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', amount: { $sum: '$amount' } } },
    { $sort: { amount: -1, _id: 1 } },
  ]);
  const ids = rows.map((row) => row._id).filter(Boolean);
  const categories = await Category.find({ _id: { $in: ids }, userId }).select('name color').lean();
  const byId = new Map(categories.map((category) => [String(category._id), category]));

  return rows.map((row) => {
    const category = row._id ? byId.get(String(row._id)) : null;

    return {
      name: category?.name || 'Uncategorized',
      amount: row.amount,
      color: category?.color || '#667085',
    };
  });
}

function serializeExpense(expense) {
  return {
    id: `expense-${expense._id}`,
    type: 'expense',
    amount: expense.amount,
    title: expense.description || 'Expense',
    date: expense.expenseDate,
    category: expense.categoryId?.name || null,
    paymentMethod: expense.paymentMethod || null,
    createdAt: expense.createdAt,
  };
}

function serializeIncome(income) {
  return {
    id: `income-${income._id}`,
    type: 'income',
    amount: income.amount,
    title: income.source,
    date: income.incomeDate,
    category: null,
    paymentMethod: null,
    createdAt: income.createdAt,
  };
}

function byNewest(left, right) {
  const byDate = new Date(right.date) - new Date(left.date);

  if (byDate !== 0) {
    return byDate;
  }

  return new Date(right.createdAt) - new Date(left.createdAt);
}

function recentMonths(count) {
  const now = new Date();
  const months = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59, 999));
    const month = start.getUTCMonth() + 1;

    months.push({
      key: `${start.getUTCFullYear()}-${String(month).padStart(2, '0')}`,
      label: start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      start,
      end,
    });
  }

  return months;
}
