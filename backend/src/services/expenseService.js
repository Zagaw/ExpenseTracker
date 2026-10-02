import mongoose from 'mongoose';
import { PAYMENT_METHODS } from '../constants/domain.js';
import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { AppError } from '../utils/AppError.js';
import { toCsv } from '../utils/csv.js';
import { endOfDateOnly, parseDateOnly } from '../utils/dateUtils.js';
import { parseDocumentId, requireUserId } from '../utils/ownership.js';
import { keepOwnedCategory } from './categoryService.js';
import { createOwnedRepository } from './ownedRepository.js';
import { recurringExpenseService } from './recurringExpenseService.js';

const expenseFields = {
  categoryId: {
    type: 'objectId',
    required: true,
    requiredMessage: 'Category is required',
  },
  amount: {
    type: 'amount',
    required: true,
    requiredMessage: 'Amount must be greater than 0',
  },
  description: { type: 'string', max: 200, label: 'Description' },
  expenseDate: {
    type: 'date',
    required: true,
    label: 'Date',
    requiredMessage: 'Date is required',
  },
  paymentMethod: {
    type: 'enum',
    values: PAYMENT_METHODS,
    message: 'Payment method is not supported',
  },
  notes: { type: 'string', max: 1000, label: 'Notes' },
};

const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
  bank_transfer: 'Bank transfer',
  mobile_wallet: 'Mobile wallet',
  other: 'Other',
};

const EXPORT_LIMIT = 10000;

const SORTS = {
  date_desc: { expenseDate: -1, createdAt: -1 },
  date_asc: { expenseDate: 1, createdAt: 1 },
  amount_desc: { amount: -1, createdAt: -1 },
  amount_asc: { amount: 1, createdAt: 1 },
};

const repository = createOwnedRepository(Expense, {
  fields: expenseFields,
  notFoundMessage: 'Expense not found',
  sort: SORTS.date_desc,
  beforeWrite: keepOwnedCategory,
});

async function present(userId, id) {
  const ownerId = requireUserId(userId);
  const documentId = parseDocumentId(id);

  if (!documentId) {
    throw new AppError('Expense not found', 404);
  }

  const expense = await Expense.findOne({ _id: documentId, userId: ownerId })
    .populate('categoryId', 'name icon color')
    .lean();

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return serializeExpense(expense);
}

async function list(userId, query) {
  if (query === undefined) {
    return repository.list(userId);
  }

  const { filter, sort, page, limit } = await prepareExpenseQuery(userId, query, true);

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('categoryId', 'name icon color')
      .lean(),
    Expense.countDocuments(filter),
  ]);

  return {
    expenses: expenses.map(serializeExpense),
    page,
    limit,
    total,
  };
}

async function exportCsv(userId, query) {
  const { filter, sort } = await prepareExpenseQuery(userId, query, false);
  const total = await Expense.countDocuments(filter);

  if (total > EXPORT_LIMIT) {
    throw new AppError('Too many expenses to export. Narrow the filters and try again.', 400);
  }

  const expenses = await Expense.find(filter)
    .sort(sort)
    .populate('categoryId', 'name')
    .lean();
  const today = new Date().toISOString().slice(0, 10);

  return {
    filename: `expenses-${today}.csv`,
    csv: toCsv([
      ['Date', 'Description', 'Category', 'Payment Method', 'Amount'],
      ...expenses.map((expense) => [
        new Date(expense.expenseDate).toISOString().slice(0, 10),
        expense.description || '',
        expense.categoryId?.name || 'Uncategorized',
        PAYMENT_LABELS[expense.paymentMethod] || expense.paymentMethod,
        expense.amount,
      ]),
    ]),
  };
}

async function prepareExpenseQuery(userId, query, paginate) {
  const ownerId = requireUserId(userId);
  await recurringExpenseService.processDue(ownerId);
  const filter = { userId: ownerId };
  const errors = {};

  applySearch(filter, query.search, errors);
  await applyCategory(filter, ownerId, query.category, errors);
  applyDateRange(filter, query, errors);
  applyPaymentMethod(filter, query.paymentMethod ?? query.payment_method, errors);

  const sort = resolveSort(query.sort, errors);
  const page = paginate ? readPage(query.page, errors) : 1;
  const limit = paginate ? readLimit(query.limit, errors) : 0;

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return { filter, sort, page, limit };
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
    { description: { $regex: pattern, $options: 'i' } },
    { notes: { $regex: pattern, $options: 'i' } },
  ];
}

async function applyCategory(filter, ownerId, category, errors) {
  if (category === undefined || category === '') {
    return;
  }

  if (typeof category !== 'string') {
    errors.category = 'Category is not valid';
    return;
  }

  if (/^[a-f\d]{24}$/i.test(category)) {
    const owned = await Category.findOne({ _id: category, userId: ownerId }).select('_id').lean();
    filter.categoryId = owned ? owned._id : new mongoose.Types.ObjectId();
    return;
  }

  const matches = await Category.find({ userId: ownerId, name: category.trim() })
    .collation({ locale: 'en', strength: 2 })
    .select('_id')
    .lean();

  filter.categoryId = { $in: matches.map((item) => item._id) };
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
    filter.expenseDate = range;
  }
}

function applyPaymentMethod(filter, paymentMethod, errors) {
  if (paymentMethod === undefined || paymentMethod === '') {
    return;
  }

  if (typeof paymentMethod !== 'string') {
    errors.paymentMethod = 'Payment method is not supported';
    return;
  }

  const normalized = paymentMethod.trim().toLowerCase();

  if (!PAYMENT_METHODS.includes(normalized)) {
    errors.paymentMethod = 'Payment method is not supported';
    return;
  }

  filter.paymentMethod = normalized;
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

function readPage(value, errors) {
  return readBoundedNumber(value, 'page', 1, 1000, errors);
}

function readLimit(value, errors) {
  return readBoundedNumber(value, 'limit', 20, 50, errors);
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

export function serializeExpense(expense) {
  const category = expense.categoryId && typeof expense.categoryId === 'object'
    ? {
      id: String(expense.categoryId._id),
      name: expense.categoryId.name,
      icon: expense.categoryId.icon,
      color: expense.categoryId.color,
    }
    : null;

  return {
    id: String(expense._id),
    amount: expense.amount,
    description: expense.description || '',
    notes: expense.notes || '',
    expenseDate: expense.expenseDate,
    paymentMethod: expense.paymentMethod,
    category,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export const expenseService = {
  ...repository,
  list,
  present,
  exportCsv,
};
