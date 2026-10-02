import { FREQUENCIES, PAYMENT_METHODS } from '../constants/domain.js';
import { Expense } from '../models/Expense.js';
import { RecurringExpense } from '../models/RecurringExpense.js';
import { AppError } from '../utils/AppError.js';
import { parseDocumentId, requireUserId } from '../utils/ownership.js';
import { keepOwnedCategory } from './categoryService.js';
import { createOwnedRepository } from './ownedRepository.js';

const recurringExpenseFields = {
  categoryId: { type: 'objectId', nullable: true },
  amount: {
    type: 'amount',
    required: true,
    requiredMessage: 'Amount must be greater than 0',
  },
  description: {
    type: 'string',
    required: true,
    max: 200,
    label: 'Description',
    requiredMessage: 'Description is required',
  },
  frequency: {
    type: 'enum',
    required: true,
    values: FREQUENCIES,
    requiredMessage: 'Frequency is required',
    message: 'Frequency must be weekly, monthly, or yearly',
  },
  nextDate: {
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
  active: { type: 'boolean' },
};

const repository = createOwnedRepository(RecurringExpense, {
  fields: recurringExpenseFields,
  notFoundMessage: 'Recurring expense not found',
  sort: { nextDate: 1 },
  beforeWrite: keepOwnedCategory,
});

const MAX_OCCURRENCES = 36;

async function listForUser(userId) {
  const ownerId = requireUserId(userId);
  await processDue(ownerId);
  const items = await RecurringExpense.find({ userId: ownerId })
    .sort({ nextDate: 1, createdAt: 1 })
    .populate('categoryId', 'name icon color')
    .lean();

  return items.map(present);
}

async function presentOne(userId, id) {
  const ownerId = requireUserId(userId);
  const documentId = parseDocumentId(id);

  if (!documentId) {
    throw new AppError('Recurring expense not found', 404);
  }

  const item = await RecurringExpense.findOne({ _id: documentId, userId: ownerId })
    .populate('categoryId', 'name icon color')
    .lean();

  if (!item) {
    throw new AppError('Recurring expense not found', 404);
  }

  return present(item);
}

async function toggle(userId, id) {
  const ownerId = requireUserId(userId);
  const documentId = parseDocumentId(id);

  if (!documentId) {
    throw new AppError('Recurring expense not found', 404);
  }

  const current = await RecurringExpense.findOne({ _id: documentId, userId: ownerId }).lean();

  if (!current) {
    throw new AppError('Recurring expense not found', 404);
  }

  await RecurringExpense.updateOne(
    { _id: documentId, userId: ownerId },
    { $set: { active: !current.active } },
  );

  if (!current.active) {
    await processDue(ownerId);
  }

  return presentOne(ownerId, documentId);
}

async function processDue(userId) {
  const ownerId = requireUserId(userId);
  const todayEnd = endOfToday();
  const due = await RecurringExpense.find({
    userId: ownerId,
    active: true,
    nextDate: { $lte: todayEnd },
  }).lean();

  for (const item of due) {
    const anchor = item.nextDate;
    let steps = 0;

    while (steps < MAX_OCCURRENCES && addFrequency(anchor, steps, item.frequency) <= todayEnd) {
      const occurrence = addFrequency(anchor, steps, item.frequency);

      try {
        await Expense.create({
          userId: ownerId,
          categoryId: item.categoryId || null,
          amount: item.amount,
          description: item.description,
          expenseDate: occurrence,
          paymentMethod: item.paymentMethod || 'cash',
          notes: '',
          recurringExpenseId: item._id,
          occurrenceDate: occurrence,
        });
      } catch (error) {
        if (error?.code !== 11000) {
          throw error;
        }
      }

      steps += 1;
    }

    if (steps > 0) {
      await RecurringExpense.updateOne(
        { _id: item._id, userId: ownerId, nextDate: anchor },
        { $set: { nextDate: addFrequency(anchor, steps, item.frequency), lastProcessedAt: new Date() } },
      );
    }
  }
}

function addFrequency(anchor, steps, frequency) {
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const day = anchor.getUTCDate();

  if (frequency === 'weekly') {
    return new Date(Date.UTC(year, month, day + (7 * steps)));
  }

  if (frequency === 'yearly') {
    return dateWithDay(year + steps, month, day);
  }

  return dateWithDay(year, month + steps, day);
}

function dateWithDay(year, month, day) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

function endOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
}

function present(item) {
  const category = item.categoryId && item.categoryId.name
    ? {
      id: String(item.categoryId._id),
      name: item.categoryId.name,
      icon: item.categoryId.icon,
      color: item.categoryId.color,
    }
    : null;

  return {
    id: String(item._id),
    amount: item.amount,
    description: item.description,
    frequency: item.frequency,
    nextDate: item.nextDate,
    paymentMethod: item.paymentMethod,
    active: item.active,
    lastProcessedAt: item.lastProcessedAt,
    category,
  };
}

export const recurringExpenseService = {
  ...repository,
  listForUser,
  presentOne,
  toggle,
  processDue,
};
