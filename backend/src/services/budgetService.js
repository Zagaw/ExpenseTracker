import { Budget } from '../models/Budget.js';
import { Expense } from '../models/Expense.js';
import { AppError } from '../utils/AppError.js';
import { parseDocumentId, requireUserId } from '../utils/ownership.js';
import { keepOwnedCategory } from './categoryService.js';
import { createOwnedRepository } from './ownedRepository.js';

const budgetFields = {
  categoryId: { type: 'objectId', nullable: true },
  amount: {
    type: 'amount',
    required: true,
    requiredMessage: 'Amount must be greater than 0',
  },
  month: {
    type: 'integer',
    required: true,
    min: 1,
    max: 12,
    requiredMessage: 'Month must be between 1 and 12',
    message: 'Month must be between 1 and 12',
  },
  year: {
    type: 'integer',
    required: true,
    min: 2000,
    max: 2100,
    requiredMessage: 'Year is not valid',
    message: 'Year is not valid',
  },
};

const repository = createOwnedRepository(Budget, {
  fields: budgetFields,
  notFoundMessage: 'Budget not found',
  duplicateMessage: 'A budget already exists for this category and month.',
  sort: { year: -1, month: -1 },
  beforeWrite: keepOwnedCategory,
});

async function listWithProgress(userId, query = {}) {
  const ownerId = requireUserId(userId);
  const period = readPeriod(query);
  const [budgets, spending] = await Promise.all([
    Budget.find({ userId: ownerId, month: period.month, year: period.year })
      .populate('categoryId', 'name icon color')
      .lean(),
    spentInMonth(ownerId, period.year, period.month),
  ]);

  return {
    month: period.month,
    year: period.year,
    budgets: budgets.map((budget) => decorate(budget, spentFor(budget, spending))).sort(byCategoryName),
  };
}

async function progress(userId, query = {}) {
  const overview = await listWithProgress(userId, query);
  const overall = overview.budgets.find((budget) => budget.category === null);

  if (!overall) {
    const spending = await spentInMonth(requireUserId(userId), overview.year, overview.month);
    return {
      budget: null,
      spent: spending.total,
      remaining: null,
      percentage: 0,
      status: 'none',
      month: overview.month,
      year: overview.year,
    };
  }

  return {
    budget: overall.amount,
    spent: overall.spent,
    remaining: overall.remaining,
    percentage: overall.percentage,
    status: overall.status,
    month: overview.month,
    year: overview.year,
  };
}

async function present(userId, id) {
  const ownerId = requireUserId(userId);
  const documentId = parseDocumentId(id);

  if (!documentId) {
    throw new AppError('Budget not found', 404);
  }

  const budget = await Budget.findOne({ _id: documentId, userId: ownerId })
    .populate('categoryId', 'name icon color')
    .lean();

  if (!budget) {
    throw new AppError('Budget not found', 404);
  }

  const spending = await spentInMonth(ownerId, budget.year, budget.month);
  return decorate(budget, spentFor(budget, spending));
}

async function spentInMonth(userId, year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const rows = await Expense.aggregate([
    { $match: { userId, expenseDate: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', spent: { $sum: '$amount' } } },
  ]);
  const byCategory = new Map(rows.map((row) => [row._id ? String(row._id) : null, row.spent]));

  return {
    byCategory,
    total: rows.reduce((sum, row) => sum + row.spent, 0),
  };
}

function spentFor(budget, spending) {
  const category = budget.categoryId;

  if (!category) {
    return spending.total;
  }

  const categoryId = category._id || category;
  return spending.byCategory.get(String(categoryId)) ?? 0;
}

function decorate(budget, spent) {
  const percentage = Math.round((spent / budget.amount) * 100);
  const category = budget.categoryId && budget.categoryId.name
    ? {
      id: String(budget.categoryId._id),
      name: budget.categoryId.name,
      icon: budget.categoryId.icon,
      color: budget.categoryId.color,
    }
    : null;

  return {
    id: String(budget._id),
    amount: budget.amount,
    month: budget.month,
    year: budget.year,
    category,
    spent,
    remaining: budget.amount - spent,
    percentage,
    status: budgetStatus(percentage),
  };
}

function budgetStatus(percentage) {
  if (percentage >= 100) {
    return 'exceeded';
  }

  if (percentage >= 90) {
    return 'danger';
  }

  if (percentage >= 70) {
    return 'warning';
  }

  return 'normal';
}

function byCategoryName(left, right) {
  if (!left.category && right.category) {
    return -1;
  }

  if (left.category && !right.category) {
    return 1;
  }

  return (left.category?.name || '').localeCompare(right.category?.name || '');
}

function readPeriod(query) {
  const now = new Date();
  const errors = {};
  const month = readQueryNumber(query.month, now.getUTCMonth() + 1, 'month', 1, 12, errors);
  const year = readQueryNumber(query.year, now.getUTCFullYear(), 'year', 2000, 2100, errors);

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return { month, year };
}

function readQueryNumber(value, fallback, field, min, max, errors) {
  if (value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    errors[field] = field === 'month' ? 'Month must be between 1 and 12' : 'Year is not valid';
    return fallback;
  }

  const number = Number(value);

  if (number < min || number > max) {
    errors[field] = field === 'month' ? 'Month must be between 1 and 12' : 'Year is not valid';
    return fallback;
  }

  return number;
}

export const budgetService = {
  ...repository,
  listWithProgress,
  progress,
  present,
};
