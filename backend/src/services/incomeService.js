import { Income } from '../models/Income.js';
import { AppError } from '../utils/AppError.js';
import { endOfDateOnly, parseDateOnly } from '../utils/dateUtils.js';
import { requireUserId } from '../utils/ownership.js';
import { createOwnedRepository } from './ownedRepository.js';

const incomeFields = {
  amount: {
    type: 'amount',
    required: true,
    requiredMessage: 'Amount must be greater than 0',
  },
  source: {
    type: 'string',
    required: true,
    max: 80,
    label: 'Source',
    requiredMessage: 'Source is required',
  },
  description: { type: 'string', max: 200, label: 'Description' },
  incomeDate: {
    type: 'date',
    required: true,
    label: 'Date',
    requiredMessage: 'Date is required',
  },
};

const SORTS = {
  date_desc: { incomeDate: -1, createdAt: -1 },
  date_asc: { incomeDate: 1, createdAt: 1 },
  amount_desc: { amount: -1, createdAt: -1 },
  amount_asc: { amount: 1, createdAt: 1 },
};

const repository = createOwnedRepository(Income, {
  fields: incomeFields,
  notFoundMessage: 'Income not found',
  sort: SORTS.date_desc,
});

async function present(userId, id) {
  const income = await repository.getById(userId, id);
  return serializeIncome(income);
}

async function list(userId, query) {
  if (query === undefined) {
    return repository.list(userId);
  }

  const ownerId = requireUserId(userId);
  const filter = { userId: ownerId };
  const errors = {};

  applySearch(filter, query.search, errors);
  applyDateRange(filter, query, errors);

  const sort = resolveSort(query.sort, errors);
  const page = readBoundedNumber(query.page, 'page', 1, 1000, errors);
  const limit = readBoundedNumber(query.limit, 'limit', 20, 50, errors);

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  const [income, total, totals] = await Promise.all([
    Income.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Income.countDocuments(filter),
    Income.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]),
  ]);

  return {
    income: income.map(serializeIncome),
    page,
    limit,
    total,
    totalAmount: totals[0]?.totalAmount ?? 0,
  };
}

function applySearch(filter, search, errors) {
  if (search === undefined || search === '') {
    return;
  }

  if (typeof search !== 'string') {
    errors.search = 'Search must be text';
    return;
  }

  const term = search.trim().slice(0, 80);

  if (!term) {
    return;
  }

  const pattern = escapeRegex(term);
  filter.$or = [
    { source: { $regex: pattern, $options: 'i' } },
    { description: { $regex: pattern, $options: 'i' } },
  ];
}

function applyDateRange(filter, query, errors) {
  const range = {};

  if (query.from !== undefined && query.from !== '') {
    const from = parseDateOnly(query.from);

    if (!from) {
      errors.from = 'A valid date is required';
    } else {
      range.$gte = from;
    }
  }

  if (query.to !== undefined && query.to !== '') {
    const to = parseDateOnly(query.to);

    if (!to) {
      errors.to = 'A valid date is required';
    } else {
      range.$lte = endOfDateOnly(to);
    }
  }

  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    errors.from = 'The start date must be on or before the end date';
  }

  if (Object.keys(range).length > 0 && !errors.from && !errors.to) {
    filter.incomeDate = range;
  }
}

function resolveSort(sort, errors) {
  if (sort === undefined || sort === '') {
    return SORTS.date_desc;
  }

  if (typeof sort !== 'string' || !SORTS[sort]) {
    errors.sort = 'Sort is not supported';
    return SORTS.date_desc;
  }

  return SORTS[sort];
}

function readBoundedNumber(value, field, fallback, max, errors) {
  if (value === undefined || value === '') {
    return fallback;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    errors[field] = `${field} is not valid`;
    return fallback;
  }

  const number = Number(value);

  if (number < 1 || number > max) {
    errors[field] = `${field} is not valid`;
    return fallback;
  }

  return number;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function serializeIncome(income) {
  return {
    id: String(income._id),
    amount: income.amount,
    source: income.source,
    description: income.description || '',
    incomeDate: income.incomeDate,
    createdAt: income.createdAt,
    updatedAt: income.updatedAt,
  };
}

export const incomeService = {
  ...repository,
  list,
  present,
};
