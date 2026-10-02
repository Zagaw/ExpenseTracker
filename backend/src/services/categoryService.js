import { CATEGORY_ICONS, DEFAULT_CATEGORIES } from '../constants/domain.js';
import { Budget } from '../models/Budget.js';
import { Category } from '../models/Category.js';
import { Expense } from '../models/Expense.js';
import { RecurringExpense } from '../models/RecurringExpense.js';
import { AppError } from '../utils/AppError.js';
import { parseDocumentId, requireUserId } from '../utils/ownership.js';
import { withBestEffortTransaction } from '../utils/transaction.js';
import { createOwnedRepository } from './ownedRepository.js';

const categoryFields = {
  name: {
    type: 'string',
    required: true,
    max: 40,
    label: 'Category name',
    requiredMessage: 'Category name is required',
  },
  icon: {
    type: 'icon',
    required: true,
    requiredMessage: 'Icon is required',
    values: CATEGORY_ICONS,
  },
  color: {
    type: 'color',
    required: true,
    requiredMessage: 'Color is required',
  },
};

const repository = createOwnedRepository(Category, {
  fields: categoryFields,
  notFoundMessage: 'Category not found',
  duplicateMessage: 'A category with this name already exists.',
  sort: { name: 1 },
});

export const categoryService = {
  list: repository.list,
  listWithSpending,
  getById: repository.getById,
  create: repository.create,
  update: repository.update,
  present,
  remove: deleteCategory,
  ensureDefaultCategories,
  deleteCategory,
};

export async function assertOwnedCategory(userId, categoryId) {
  if (categoryId === null) {
    return null;
  }

  const category = await Category.findOne({ _id: categoryId, userId }).select('_id').lean();

  if (!category) {
    throw new AppError('Validation failed', 400, {
      categoryId: 'Category not found',
    });
  }

  return category._id;
}

export async function keepOwnedCategory(userId, data) {
  if (!Object.prototype.hasOwnProperty.call(data, 'categoryId')) {
    return data;
  }

  return {
    ...data,
    categoryId: await assertOwnedCategory(userId, data.categoryId),
  };
}

async function present(userId, id) {
  const category = await repository.getById(userId, id);
  const spent = await spentForCategory(userId, category._id);
  return serializeCategory(category, spent);
}

async function listWithSpending(userId) {
  const ownerId = requireUserId(userId);
  const [categories, totals] = await Promise.all([
    Category.find({ userId: ownerId }).collation({ locale: 'en', strength: 2 }).sort({ name: 1 }).lean(),
    Expense.aggregate([
      { $match: { userId: ownerId } },
      { $group: { _id: '$categoryId', spent: { $sum: '$amount' } } },
    ]),
  ]);
  const spentByCategory = new Map(totals.map((row) => [row._id ? String(row._id) : null, row.spent]));

  return {
    categories: categories.map((category) => serializeCategory(
      category,
      spentByCategory.get(String(category._id)) ?? 0,
    )),
    uncategorizedSpent: spentByCategory.get(null) ?? 0,
  };
}

async function spentForCategory(userId, categoryId) {
  const ownerId = requireUserId(userId);
  const [row] = await Expense.aggregate([
    { $match: { userId: ownerId, categoryId } },
    { $group: { _id: null, spent: { $sum: '$amount' } } },
  ]);

  return row?.spent ?? 0;
}

function serializeCategory(category, spent) {
  return {
    id: String(category._id),
    name: category.name,
    icon: category.icon,
    color: category.color,
    spent,
  };
}

export async function ensureDefaultCategories(userId) {
  const ownerId = requireUserId(userId);

  await Category.bulkWrite(
    DEFAULT_CATEGORIES.map((category) => ({
      updateOne: {
        filter: { userId: ownerId, name: category.name },
        update: {
          $setOnInsert: {
            userId: ownerId,
            name: category.name,
            icon: category.icon,
            color: category.color,
          },
        },
        upsert: true,
      },
    })),
  );

  return Category.find({ userId: ownerId }).sort({ name: 1 }).lean();
}

export async function deleteCategory(userId, categoryId) {
  const ownerId = requireUserId(userId);
  const documentId = parseDocumentId(categoryId);

  if (!documentId) {
    throw new AppError('Category not found', 404);
  }

  const category = await Category.findOne({ _id: documentId, userId: ownerId }).lean();

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  await withBestEffortTransaction(async (session) => {
    const options = session ? { session } : undefined;

    await Expense.updateMany(
      { userId: ownerId, categoryId: category._id },
      { $set: { categoryId: null } },
      options,
    );
    await RecurringExpense.updateMany(
      { userId: ownerId, categoryId: category._id },
      { $set: { categoryId: null } },
      options,
    );
    // Category budgets are removed so they cannot collide with the overall monthly budget.
    await Budget.deleteMany({ userId: ownerId, categoryId: category._id }, options);
    await Category.deleteOne({ _id: category._id, userId: ownerId }, options);
  });

  return category;
}
