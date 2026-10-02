import { Expense } from '../models/Expense.js';
import { Income } from '../models/Income.js';
import { Notification } from '../models/Notification.js';
import { Profile } from '../models/Profile.js';
import { RecurringExpense } from '../models/RecurringExpense.js';
import { NOTIFICATION_TYPES } from '../constants/domain.js';
import { AppError } from '../utils/AppError.js';
import { parseDocumentId, requireUserId } from '../utils/ownership.js';
import { budgetService } from './budgetService.js';
import { createOwnedRepository } from './ownedRepository.js';
import { recurringExpenseService } from './recurringExpenseService.js';

const notificationFields = {
  type: {
    type: 'enum',
    required: true,
    values: NOTIFICATION_TYPES,
    requiredMessage: 'Notification type is required',
    message: 'Notification type is not supported',
  },
  title: {
    type: 'string',
    required: true,
    max: 120,
    label: 'Title',
    requiredMessage: 'Title is required',
  },
  message: {
    type: 'string',
    required: true,
    max: 500,
    label: 'Message',
    requiredMessage: 'Message is required',
  },
  isRead: { type: 'boolean' },
};

const repository = createOwnedRepository(Notification, {
  fields: notificationFields,
  notFoundMessage: 'Notification not found',
  sort: { createdAt: -1 },
});

const REMINDER_DAYS = 3;

async function listForUser(userId) {
  const ownerId = requireUserId(userId);
  await sync(ownerId);
  const notifications = await Notification.find({ userId: ownerId, dismissed: { $ne: true } })
    .sort({ createdAt: -1 })
    .lean();
  return notifications.map(present);
}

async function countUnread(userId) {
  const ownerId = requireUserId(userId);
  await sync(ownerId);
  return Notification.countDocuments({ userId: ownerId, isRead: false, dismissed: { $ne: true } });
}

async function markRead(userId, id) {
  const notification = await setRead(userId, id, true);
  return present(notification);
}

async function markAllRead(userId) {
  const ownerId = requireUserId(userId);
  const result = await Notification.updateMany(
    { userId: ownerId, isRead: false, dismissed: { $ne: true } },
    { $set: { isRead: true } },
  );

  return { updated: result.modifiedCount };
}

async function removeForUser(userId, id) {
  const ownerId = requireUserId(userId);
  const documentId = parseDocumentId(id);

  if (!documentId) {
    throw new AppError('Notification not found', 404);
  }

  const deleted = await Notification.findOneAndUpdate(
    { _id: documentId, userId: ownerId, dismissed: { $ne: true } },
    { $set: { dismissed: true, isRead: true } },
    { returnDocument: 'after' },
  ).lean();

  if (!deleted) {
    throw new AppError('Notification not found', 404);
  }

  return { id: String(deleted._id) };
}

async function setRead(userId, id) {
  const ownerId = requireUserId(userId);
  const documentId = parseDocumentId(id);

  if (!documentId) {
    throw new AppError('Notification not found', 404);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: documentId, userId: ownerId },
    { $set: { isRead: true } },
    { returnDocument: 'after' },
  ).lean();

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
}

async function sync(userId) {
  await recurringExpenseService.processDue(userId);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const periodKey = `${year}-${String(month).padStart(2, '0')}`;
  const todayStart = new Date(Date.UTC(year, month - 1, day));
  const horizon = new Date(Date.UTC(year, month - 1, day + REMINDER_DAYS, 23, 59, 59, 999));
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [budgetPeriod, recurring, income, expenses, profile] = await Promise.all([
    budgetService.listWithProgress(userId, { month: String(month), year: String(year) }),
    RecurringExpense.find({ userId, active: true, nextDate: { $lte: horizon } })
      .select('description nextDate')
      .lean(),
    periodTotal(Income, userId, 'incomeDate', monthStart, monthEnd),
    periodTotal(Expense, userId, 'expenseDate', monthStart, monthEnd),
    Profile.findOne({ userId }).select('currency notifyBudgets notifyRecurring notifyReports').lean(),
  ]);
  const currency = profile?.currency || 'MMK';
  const notifyBudgets = profile?.notifyBudgets !== false;
  const notifyRecurring = profile?.notifyRecurring !== false;
  const notifyReports = profile?.notifyReports !== false;
  const drafts = [];

  for (const budget of budgetPeriod.budgets) {
    const target = budget.category ? `${budget.category.name} budget` : 'monthly budget';
    const message = `You have used ${budget.percentage}% of your ${target}.`;

    if (notifyBudgets && (budget.status === 'warning' || budget.status === 'danger')) {
      drafts.push({
        dedupeKey: `budget_warning:${budget.id}:${periodKey}`,
        type: 'budget_warning',
        title: 'Budget warning',
        message,
      });
    }

    if (notifyBudgets && budget.status === 'exceeded') {
      drafts.push({
        dedupeKey: `budget_exceeded:${budget.id}:${periodKey}`,
        type: 'budget_exceeded',
        title: 'Budget exceeded',
        message,
      });
    }
  }

  for (const item of notifyRecurring ? recurring : []) {
    drafts.push({
      dedupeKey: `recurring_reminder:${item._id}:${item.nextDate.toISOString().slice(0, 10)}`,
      type: 'recurring_reminder',
      title: 'Recurring expense',
      message: reminderMessage(item.description, item.nextDate, todayStart),
    });
  }

  if (notifyReports && (income > 0 || expenses > 0)) {
    const label = monthStart.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    drafts.push({
      dedupeKey: `monthly_report:${periodKey}`,
      type: 'monthly_report',
      title: 'Monthly report',
      message: `Your ${label} report is ready. Income ${formatMoney(income, currency)}, expenses ${formatMoney(expenses, currency)}.`,
    });
  }

  const existing = await Notification.find({
    userId,
    dedupeKey: { $in: drafts.map((draft) => draft.dedupeKey) },
  }).select('dedupeKey').lean();
  const seen = new Set(existing.map((item) => item.dedupeKey));

  for (const draft of drafts) {
    if (seen.has(draft.dedupeKey)) {
      continue;
    }

    try {
      await Notification.create({ ...draft, userId, isRead: false });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }
  }
}

async function periodTotal(Model, userId, field, start, end) {
  const [row] = await Model.aggregate([
    { $match: { userId, [field]: { $gte: start, $lte: end } } },
    { $group: { _id: null, amount: { $sum: '$amount' } } },
  ]);

  return row?.amount ?? 0;
}

function reminderMessage(description, nextDate, todayStart) {
  const dueStart = new Date(Date.UTC(nextDate.getUTCFullYear(), nextDate.getUTCMonth(), nextDate.getUTCDate()));
  const formatted = nextDate.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  if (dueStart.getTime() === todayStart.getTime()) {
    return `${description} is due today.`;
  }

  if (dueStart < todayStart) {
    return `${description} was due on ${formatted}.`;
  }

  return `${description} is due on ${formatted}.`;
}

function formatMoney(amount, currency) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
}

function present(notification) {
  return {
    id: String(notification._id),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

export const notificationService = {
  ...repository,
  listForUser,
  countUnread,
  markRead,
  markAllRead,
  removeForUser,
};
