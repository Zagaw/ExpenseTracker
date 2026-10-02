import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { Income } from '../models/Income.js';
import { Profile } from '../models/Profile.js';
import { requireUserId } from '../utils/ownership.js';
import { budgetService } from './budgetService.js';

const SPENDING_CHANGE = 15;
const MAX_SPENDING_NOTES = 3;

export async function listInsights(userId, options = {}) {
  const ownerId = requireUserId(userId);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const current = monthRange(year, month);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const previous = monthRange(previousYear, previousMonth);

  const [currentRows, previousRows, incomeRows, expenses, budgetPeriod, profile] = await Promise.all([
    categorySpending(ownerId, current.start, current.end),
    categorySpending(ownerId, previous.start, previous.end),
    Income.aggregate([
      { $match: { userId: ownerId, incomeDate: { $gte: current.start, $lte: current.end } } },
      { $group: { _id: null, amount: { $sum: '$amount' } } },
    ]),
    Expense.find({ userId: ownerId, expenseDate: { $gte: current.start, $lte: current.end } })
      .select('amount description')
      .lean(),
    options.budgetPeriod
      ? Promise.resolve(options.budgetPeriod)
      : budgetService.listWithProgress(ownerId, {}),
    Profile.findOne({ userId: ownerId }).select('currency').lean(),
  ]);

  const currency = profile?.currency || 'MMK';
  const categories = await categoryLookup(ownerId, [...currentRows, ...previousRows]);
  const currentByCategory = spendingMap(currentRows);
  const previousByCategory = spendingMap(previousRows);
  const monthlyExpenses = sumAmounts(currentRows);
  const monthlyIncome = incomeRows[0]?.amount ?? 0;
  const insights = [];

  for (const budget of sortBudgets(budgetPeriod.budgets)) {
    if (budget.status === 'exceeded') {
      insights.push(budgetInsight('budget_exceeded', 'Budget exceeded', 'danger', budget));
    }
  }

  for (const budget of sortBudgets(budgetPeriod.budgets)) {
    if (budget.status === 'warning' || budget.status === 'danger') {
      insights.push(budgetInsight('budget_warning', 'Budget warning', 'warning', budget));
    }
  }

  insights.push(...spendingChanges(currentByCategory, previousByCategory, categories));

  const unusual = unusualExpense(expenses);

  if (unusual) {
    insights.push({
      id: `unusual-${unusual._id}`,
      type: 'unusual_expense',
      tone: 'warning',
      title: 'Higher than usual',
      message: `${unusual.description || 'An expense'} is ${formatMoney(unusual.amount, currency)}, higher than your other expenses this month.`,
    });
  }

  if (monthlyIncome > 0 || monthlyExpenses > 0) {
    insights.push(balanceInsight(monthlyIncome, monthlyExpenses));
  }

  const ranked = [...currentByCategory.entries()]
    .map(([key, amount]) => ({ key, amount, name: categories.get(key)?.name || 'Uncategorized' }))
    .filter((row) => row.amount > 0)
    .sort((left, right) => right.amount - left.amount || left.name.localeCompare(right.name));

  if (ranked[0]) {
    insights.push({
      id: 'largest-category',
      type: 'largest_category',
      tone: 'info',
      title: 'Largest category',
      message: `${ranked[0].name} is your largest category this month, at ${formatMoney(ranked[0].amount, currency)}.`,
    });
  }

  if (ranked[1]) {
    insights.push({
      id: 'second-category',
      type: 'second_category',
      tone: 'info',
      title: 'Second-largest category',
      message: `${ranked[1].name} is your second-largest category this month.`,
    });
  }

  if (monthlyExpenses > 0) {
    insights.push({
      id: 'daily-spending',
      type: 'daily_spending',
      tone: 'info',
      title: 'Daily spending',
      message: `Your average daily spending is ${formatMoney(Math.round(monthlyExpenses / now.getUTCDate()), currency)}.`,
    });
  }

  const overall = budgetPeriod.budgets.find((budget) => budget.category === null && budget.status === 'normal');

  if (overall) {
    insights.push({
      id: `budget-${overall.id}`,
      type: 'budget_usage',
      tone: 'positive',
      title: 'Budget usage',
      message: `You have used ${overall.percentage}% of your monthly budget.`,
    });
  }

  return insights;
}

function spendingChanges(currentByCategory, previousByCategory, categories) {
  const keys = new Set([...currentByCategory.keys(), ...previousByCategory.keys()]);
  const changes = [];

  for (const key of keys) {
    const current = currentByCategory.get(key) ?? 0;
    const previous = previousByCategory.get(key) ?? 0;

    if (previous <= 0) {
      continue;
    }

    const change = Math.round(((current - previous) / previous) * 100);

    if (Math.abs(change) < SPENDING_CHANGE) {
      continue;
    }

    const name = categories.get(key)?.name || 'Uncategorized';
    const increased = change > 0;

    changes.push({
      id: `${increased ? 'spending-increase' : 'spending-decrease'}-${key}`,
      type: increased ? 'spending_increase' : 'spending_decrease',
      tone: 'info',
      title: increased ? 'Spending increased' : 'Spending decreased',
      message: `Your ${name} spending is ${Math.abs(change)}% ${increased ? 'higher' : 'lower'} than last month.`,
      difference: Math.abs(current - previous),
    });
  }

  return changes
    .sort((left, right) => right.difference - left.difference || left.message.localeCompare(right.message))
    .slice(0, MAX_SPENDING_NOTES)
    .map(({ difference, ...insight }) => insight);
}

function unusualExpense(expenses) {
  if (expenses.length < 3) {
    return null;
  }

  let selected = null;

  for (const expense of expenses) {
    const others = expenses.filter((item) => item !== expense);
    const average = others.reduce((sum, item) => sum + item.amount, 0) / others.length;

    if (average > 0 && expense.amount >= average * 2 && (!selected || expense.amount > selected.amount)) {
      selected = expense;
    }
  }

  return selected;
}

function balanceInsight(income, expenses) {
  if (income > expenses) {
    return {
      id: 'balance',
      type: 'healthy_balance',
      tone: 'positive',
      title: 'Healthy balance',
      message: 'Your income is currently higher than your expenses this month.',
    };
  }

  if (expenses > income) {
    return {
      id: 'balance',
      type: 'expenses_higher',
      tone: 'warning',
      title: 'Expenses are higher',
      message: 'Your expenses are currently higher than your income this month.',
    };
  }

  return {
    id: 'balance',
    type: 'even_balance',
    tone: 'info',
    title: 'Even balance',
    message: 'Your income and expenses are equal this month.',
  };
}

function budgetInsight(type, title, tone, budget) {
  const target = budget.category ? `${budget.category.name} budget` : 'monthly budget';

  return {
    id: `budget-${budget.id}`,
    type,
    tone,
    title,
    message: `You have used ${budget.percentage}% of your ${target}.`,
  };
}

async function categorySpending(userId, start, end) {
  return Expense.aggregate([
    { $match: { userId, expenseDate: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', amount: { $sum: '$amount' } } },
  ]);
}

async function categoryLookup(userId, rows) {
  const ids = rows.map((row) => row._id).filter(Boolean);
  const categories = await Category.find({ _id: { $in: ids }, userId }).select('name').lean();
  const lookup = new Map(categories.map((category) => [String(category._id), category]));
  lookup.set('uncategorized', { name: 'Uncategorized' });
  return lookup;
}

function spendingMap(rows) {
  return new Map(rows.map((row) => [row._id ? String(row._id) : 'uncategorized', row.amount]));
}

function sumAmounts(rows) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function sortBudgets(budgets) {
  return [...budgets].sort((left, right) => {
    if (!left.category && right.category) {
      return -1;
    }

    if (left.category && !right.category) {
      return 1;
    }

    return (left.category?.name || '').localeCompare(right.category?.name || '');
  });
}

function monthRange(year, month) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

function formatMoney(amount, currency) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
}

export const insightService = {
  list: listInsights,
};
