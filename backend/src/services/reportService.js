import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { Income } from '../models/Income.js';
import { AppError } from '../utils/AppError.js';
import { endOfDateOnly, parseDateOnly } from '../utils/dateUtils.js';
import { requireUserId } from '../utils/ownership.js';

const UNCATEGORIZED = { name: 'Uncategorized', color: '#667085', icon: 'circle-ellipsis' };

export async function monthly(userId, query) {
  const ownerId = requireUserId(userId);
  const period = resolveReportPeriod(query);
  const [income, expenses, categories] = await Promise.all([
    periodTotals(Income, ownerId, 'incomeDate', period.start, period.end),
    periodTotals(Expense, ownerId, 'expenseDate', period.start, period.end),
    categoryTotals(ownerId, period.start, period.end),
  ]);
  const top = categories[0];

  return {
    period: presentPeriod(period),
    summary: {
      income: income.amount,
      expenses: expenses.amount,
      balance: income.amount - expenses.amount,
      averageDailySpending: averageDailySpending(expenses.amount, period.start, period.end),
      incomeCount: income.count,
      expenseCount: expenses.count,
      topCategory: top ? { name: top.name, amount: top.amount } : null,
    },
  };
}

export async function categories(userId, query) {
  const ownerId = requireUserId(userId);
  const period = resolveReportPeriod(query);
  const rows = await categoryTotals(ownerId, period.start, period.end);
  const total = rows.reduce((sum, row) => sum + row.amount, 0);

  return {
    period: presentPeriod(period),
    total,
    categories: rows.map((row) => ({
      name: row.name,
      amount: row.amount,
      color: row.color,
      icon: row.icon,
      count: row.count,
      percentage: total === 0 ? 0 : Math.round((row.amount / total) * 100),
    })),
  };
}

export async function trends(userId, query) {
  const ownerId = requireUserId(userId);
  const period = resolveReportPeriod(query);
  const buckets = buildBuckets(period);
  const [expenseTotals, incomeTotals] = await Promise.all([
    totalsByBucket(Expense, ownerId, 'expenseDate', period),
    totalsByBucket(Income, ownerId, 'incomeDate', period),
  ]);

  return {
    period: presentPeriod(period),
    grain: period.grain,
    spendingTrend: buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      amount: expenseTotals.get(bucket.key) ?? 0,
    })),
    incomeVsExpenses: buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      income: incomeTotals.get(bucket.key) ?? 0,
      expenses: expenseTotals.get(bucket.key) ?? 0,
    })),
  };
}

function resolveReportPeriod(query) {
  const errors = {};
  const hasFrom = present(query.date_from);
  const hasTo = present(query.date_to);
  const hasMonth = present(query.month);
  const hasYear = present(query.year);

  if ((hasFrom || hasTo) && (hasMonth || hasYear)) {
    throw new AppError('Validation failed', 400, {
      date_from: 'Use a date range or a month and year, not both',
    });
  }

  if (hasFrom || hasTo) {
    if (!hasFrom) {
      errors.date_from = 'Start date is not valid';
    }

    if (!hasTo) {
      errors.date_to = 'End date is not valid';
    }

    const start = hasFrom ? readDate(query.date_from, 'date_from', 'Start date is not valid', errors) : null;
    const end = hasTo ? readDate(query.date_to, 'date_to', 'End date is not valid', errors) : null;

    if (Object.keys(errors).length > 0) {
      throw new AppError('Validation failed', 400, errors);
    }

    if (start > end) {
      throw new AppError('Validation failed', 400, {
        date_to: 'End date must be on or after the start date',
      });
    }

    const limit = new Date(Date.UTC(start.getUTCFullYear() + 5, start.getUTCMonth(), start.getUTCDate()));

    if (end > limit) {
      throw new AppError('Validation failed', 400, {
        date_to: 'Date range must be 5 years or shorter',
      });
    }

    const inclusiveDays = inclusiveUtcDays(start, end);

    return {
      type: 'custom',
      grain: inclusiveDays <= 62 ? 'day' : 'month',
      start,
      end: endOfDateOnly(end),
      label: `${formatDay(start)} – ${formatDay(end)}`,
    };
  }

  const year = readOptional(query.year, 'year', 2000, 2100, errors, 'Year is not valid');
  const month = readOptional(query.month, 'month', 1, 12, errors, 'Month must be between 1 and 12');

  if (hasMonth && !hasYear) {
    errors.year = 'Year is not valid';
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  const now = new Date();
  const resolvedYear = year ?? now.getUTCFullYear();

  if (hasYear && !hasMonth) {
    const start = new Date(Date.UTC(resolvedYear, 0, 1));

    return {
      type: 'year',
      grain: 'month',
      start,
      end: endOfDateOnly(new Date(Date.UTC(resolvedYear, 11, 31))),
      label: String(resolvedYear),
    };
  }

  const resolvedMonth = month ?? now.getUTCMonth() + 1;
  const start = new Date(Date.UTC(resolvedYear, resolvedMonth - 1, 1));

  return {
    type: 'month',
    grain: 'day',
    start,
    end: endOfDateOnly(new Date(Date.UTC(resolvedYear, resolvedMonth, 0))),
    label: start.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

async function periodTotals(Model, userId, field, start, end) {
  const [row] = await Model.aggregate([
    { $match: { userId, [field]: { $gte: start, $lte: end } } },
    { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  return {
    amount: row?.amount ?? 0,
    count: row?.count ?? 0,
  };
}

async function categoryTotals(userId, start, end) {
  const rows = await Expense.aggregate([
    { $match: { userId, expenseDate: { $gte: start, $lte: end } } },
    { $group: { _id: '$categoryId', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { amount: -1, _id: 1 } },
  ]);
  const ids = rows.map((row) => row._id).filter(Boolean);
  const categories = await Category.find({ _id: { $in: ids }, userId }).select('name color icon').lean();
  const byId = new Map(categories.map((category) => [String(category._id), category]));

  return rows.map((row) => {
    const category = row._id ? byId.get(String(row._id)) : null;

    return {
      name: category?.name || UNCATEGORIZED.name,
      amount: row.amount,
      color: category?.color || UNCATEGORIZED.color,
      icon: category?.icon || UNCATEGORIZED.icon,
      count: row.count,
    };
  });
}

async function totalsByBucket(Model, userId, field, period) {
  const rows = await Model.aggregate([
    { $match: { userId, [field]: { $gte: period.start, $lte: period.end } } },
    {
      $group: {
        _id: period.grain === 'day'
          ? {
            year: { $year: `$${field}` },
            month: { $month: `$${field}` },
            day: { $dayOfMonth: `$${field}` },
          }
          : {
            year: { $year: `$${field}` },
            month: { $month: `$${field}` },
          },
        amount: { $sum: '$amount' },
      },
    },
  ]);
  const totals = new Map();

  for (const row of rows) {
    const month = String(row._id.month).padStart(2, '0');
    const key = period.grain === 'day'
      ? `${row._id.year}-${month}-${String(row._id.day).padStart(2, '0')}`
      : `${row._id.year}-${month}`;
    totals.set(key, row.amount);
  }

  return totals;
}

function buildBuckets(period) {
  if (period.grain === 'day') {
    const buckets = [];
    const cursor = new Date(period.start);

    while (cursor <= period.end) {
      buckets.push({
        key: isoDate(cursor),
        label: period.type === 'month'
          ? String(cursor.getUTCDate())
          : cursor.toLocaleString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return buckets;
  }

  const buckets = [];
  let year = period.start.getUTCFullYear();
  let month = period.start.getUTCMonth();
  const endYear = period.end.getUTCFullYear();
  const endMonth = period.end.getUTCMonth();
  const spansYears = year !== endYear;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const start = new Date(Date.UTC(year, month, 1));
    const label = start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });

    buckets.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: spansYears ? `${label} ${year}` : label,
    });
    month += 1;

    if (month === 12) {
      month = 0;
      year += 1;
    }
  }

  return buckets;
}

function presentPeriod(period) {
  return {
    type: period.type,
    label: period.label,
    from: isoDate(period.start),
    to: isoDate(period.end),
    month: period.type === 'month' ? period.start.getUTCMonth() + 1 : null,
    year: period.type === 'custom' ? null : period.start.getUTCFullYear(),
  };
}

function averageDailySpending(expenses, start, end) {
  if (expenses === 0) {
    return 0;
  }

  const now = new Date();
  const todayEnd = endOfDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
  const effectiveEnd = start <= todayEnd && end > todayEnd ? todayEnd : end;

  return Math.round(expenses / inclusiveUtcDays(start, effectiveEnd));
}

function inclusiveUtcDays(start, end) {
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.floor((endDay - startDay) / 86400000) + 1;
}

function readDate(value, field, message, errors) {
  if (typeof value !== 'string') {
    errors[field] = message;
    return null;
  }

  const date = parseDateOnly(value);

  if (!date) {
    errors[field] = message;
  }

  return date;
}

function readOptional(value, field, min, max, errors, message) {
  if (!present(value)) {
    return undefined;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    errors[field] = message;
    return undefined;
  }

  const number = Number(value);

  if (number < min || number > max) {
    errors[field] = message;
    return undefined;
  }

  return number;
}

function present(value) {
  return value !== undefined && value !== '';
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatDay(date) {
  return date.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const reportService = {
  monthly,
  categories,
  trends,
};
