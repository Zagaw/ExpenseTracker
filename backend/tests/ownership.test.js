import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { DEFAULT_CATEGORIES } from '../src/constants/domain.js';
import { connectDatabase } from '../src/config/database.js';
import { Budget } from '../src/models/Budget.js';
import { Expense } from '../src/models/Expense.js';
import { syncModelIndexes } from '../src/models/index.js';
import { User } from '../src/models/User.js';
import { budgetService } from '../src/services/budgetService.js';
import { categoryService } from '../src/services/categoryService.js';
import { expenseService } from '../src/services/expenseService.js';
import { incomeService } from '../src/services/incomeService.js';
import { notificationService } from '../src/services/notificationService.js';
import { profileService } from '../src/services/profileService.js';
import { recurringExpenseService } from '../src/services/recurringExpenseService.js';

before(async () => {
  await connectDatabase();

  if (mongoose.connection.name !== 'expense-tracker-test') {
    throw new Error(`Refusing to run tests against "${mongoose.connection.name}"`);
  }

  await mongoose.connection.dropDatabase();
  await syncModelIndexes();
});

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe('database ownership', () => {
  it('hides password hashes and rejects duplicate emails', async () => {
    const user = await User.create({
      email: 'Ada@Example.com',
      passwordHash: 'stored-hash',
    });

    const hidden = await User.findById(user._id).lean();
    assert.equal(hidden.passwordHash, undefined);
    assert.equal(hidden.email, 'ada@example.com');

    const revealed = await User.findById(user._id).select('+passwordHash').lean();
    assert.equal(revealed.passwordHash, 'stored-hash');

    await assert.rejects(
      () => User.create({ email: 'ada@example.com', passwordHash: 'other-hash' }),
      (error) => error.code === 11000,
    );
  });

  it('keeps profiles isolated and allows only one profile per user', async () => {
    const userA = await createUser('profile-a@example.com');
    const userB = await createUser('profile-b@example.com');

    const profile = await profileService.create(userA._id, {
      userId: userB._id,
      fullName: 'Aung Aung',
      currency: 'mmk',
    });

    assert.equal(String(profile.userId), String(userA._id));
    assert.equal(profile.currency, 'MMK');

    await assert.rejects(
      () => profileService.create(userA._id, { fullName: 'Again' }),
      (error) => error.statusCode === 409,
    );

    await assert.rejects(() => profileService.get(userB._id), (error) => error.statusCode === 404);

    const updated = await profileService.update(userB._id, { fullName: 'Should not apply' }).catch((error) => error);
    assert.equal(updated.statusCode, 404);

    const unchanged = await profileService.get(userA._id);
    assert.equal(unchanged.fullName, 'Aung Aung');
  });

  it('stops one user from reading, updating, or deleting another user expense', async () => {
    const userA = await createUser('expense-a@example.com');
    const userB = await createUser('expense-b@example.com');
    const categories = await categoryService.ensureDefaultCategories(userA._id);
    const food = categories.find((category) => category.name === 'Food');

    const expense = await expenseService.create(userA._id, {
      userId: userB._id,
      user_id: String(userB._id),
      category_id: food._id,
      amount: '15000',
      description: 'Dinner',
      expense_date: '2026-09-28',
      payment_method: 'Cash',
      notes: 'Dinner with friends',
    });

    assert.equal(String(expense.userId), String(userA._id));
    assert.equal(expense.amount, 15000);
    assert.equal(expense.paymentMethod, 'cash');

    const ownList = await expenseService.list(userA._id);
    const otherList = await expenseService.list(userB._id);
    assert.equal(ownList.length, 1);
    assert.equal(otherList.length, 0);

    await expectNotFound(expenseService.getById(userB._id, expense._id));
    await expectNotFound(expenseService.update(userB._id, expense._id, { description: 'Stolen' }));
    await expectNotFound(expenseService.remove(userB._id, expense._id));
    await expectNotFound(expenseService.getById(userA._id, 'not-an-id'));
    await expectNotFound(expenseService.getById(userA._id, new mongoose.Types.ObjectId()));

    const updated = await expenseService.update(userA._id, expense._id, {
      userId: userB._id,
      description: 'Updated dinner',
    });
    assert.equal(updated.description, 'Updated dinner');
    assert.equal(String(updated.userId), String(userA._id));

    await Expense.findOneAndUpdate(
      { _id: expense._id, userId: userA._id },
      { userId: userB._id, description: 'Direct hijack' },
    );
    const protectedExpense = await expenseService.getById(userA._id, expense._id);
    assert.equal(String(protectedExpense.userId), String(userA._id));
    assert.equal(protectedExpense.description, 'Direct hijack');

    await assert.rejects(
      () => expenseService.create(userB._id, {
        categoryId: food._id,
        amount: 1000,
        expenseDate: '2026-09-29',
      }),
      (error) => error.statusCode === 400 && error.errors.categoryId === 'Category not found',
    );

    await assert.rejects(
      () => expenseService.create(userA._id, { amount: 0, expenseDate: '2026-09-29' }),
      (error) => error.statusCode === 400 && error.errors.amount === 'Amount must be greater than 0',
    );
  });

  it('creates default categories per user and keeps category deletion from corrupting history', async () => {
    const userA = await createUser('category-a@example.com');
    const userB = await createUser('category-b@example.com');
    const first = await categoryService.ensureDefaultCategories(userA._id);
    const second = await categoryService.ensureDefaultCategories(userA._id);
    const other = await categoryService.ensureDefaultCategories(userB._id);

    assert.equal(first.length, DEFAULT_CATEGORIES.length);
    assert.equal(second.length, DEFAULT_CATEGORIES.length);
    assert.notEqual(String(first[0]._id), String(other[0]._id));

    await assert.rejects(
      () => categoryService.create(userA._id, { name: 'food', icon: 'utensils', color: '#112233' }),
      (error) => error.statusCode === 409,
    );

    const foodA = first.find((category) => category.name === 'Food');
    const foodB = other.find((category) => category.name === 'Food');

    await expenseService.create(userA._id, {
      categoryId: foodA._id,
      amount: 5000,
      expenseDate: '2026-09-01',
      description: 'Lunch',
    });
    await budgetService.create(userA._id, {
      categoryId: foodA._id,
      amount: 100000,
      month: 9,
      year: 2026,
    });
    const overall = await budgetService.create(userA._id, {
      categoryId: null,
      amount: 300000,
      month: 9,
      year: 2026,
    });
    await recurringExpenseService.create(userA._id, {
      categoryId: foodA._id,
      amount: 2000,
      description: 'Weekly market',
      frequency: 'weekly',
      nextDate: '2026-09-07',
    });

    const foreignExpense = await Expense.create({
      userId: userB._id,
      categoryId: foodA._id,
      amount: 10,
      expenseDate: new Date('2026-09-02'),
      description: 'Foreign link',
    });

    await expectNotFound(categoryService.deleteCategory(userA._id, foodB._id));
    await categoryService.deleteCategory(userA._id, foodA._id);

    const remainingExpenses = await expenseService.list(userA._id);
    assert.equal(remainingExpenses.length, 1);
    assert.equal(remainingExpenses[0].categoryId, null);

    const budgets = await budgetService.list(userA._id);
    assert.equal(budgets.length, 1);
    assert.equal(String(budgets[0]._id), String(overall._id));

    const recurring = await recurringExpenseService.list(userA._id);
    assert.equal(recurring[0].categoryId, null);

    const foreign = await Expense.findById(foreignExpense._id).lean();
    assert.equal(String(foreign.categoryId), String(foodA._id));
    assert.equal(await categoryService.getById(userB._id, foodB._id).then((category) => category.name), 'Food');
  });

  it('isolates income, budgets, recurring expenses, and notifications', async () => {
    const userA = await createUser('records-a@example.com');
    const userB = await createUser('records-b@example.com');

    const cases = [
      {
        service: incomeService,
        input: { amount: 600000, source: 'Salary', incomeDate: '2026-09-01', userId: userB._id },
      },
      {
        service: budgetService,
        input: { amount: 100000, month: 9, year: 2026, user_id: userB._id },
      },
      {
        service: recurringExpenseService,
        input: {
          amount: 15000,
          description: 'Rent',
          frequency: 'monthly',
          nextDate: '2026-10-01',
          userId: userB._id,
        },
      },
      {
        service: notificationService,
        input: {
          type: 'budget_warning',
          title: 'Budget warning',
          message: 'You have used 82% of your monthly budget.',
          userId: userB._id,
        },
      },
    ];

    for (const { service, input } of cases) {
      const record = await service.create(userA._id, input);
      assert.equal(String(record.userId), String(userA._id));
      assert.equal((await service.list(userB._id)).length, 0);
      await expectNotFound(service.getById(userB._id, record._id));
      await expectNotFound(service.update(userB._id, record._id, { amount: 1, title: 'Stolen', message: 'Stolen', description: 'Stolen', source: 'Stolen' }));
      await expectNotFound(service.remove(userB._id, record._id));
      assert.ok(await service.getById(userA._id, record._id));
    }

    await assert.rejects(
      () => budgetService.create(userA._id, { amount: 100000, month: 9, year: 2026 }),
      (error) => error.statusCode === 409,
    );

    const storedBudgets = await Budget.find({ userId: userA._id }).lean();
    assert.equal(storedBudgets.length, 1);
  });

  it('creates the required indexes', async () => {
    await expectIndex(User.collection, { email: 1 }, { unique: true });
    await expectIndex(mongoose.connection.collection('profiles'), { userId: 1 }, { unique: true });
    await expectIndex(mongoose.connection.collection('categories'), { userId: 1, name: 1 }, { unique: true });
    await expectIndex(Expense.collection, { userId: 1, expenseDate: -1, createdAt: -1 });
    await expectIndex(Expense.collection, { userId: 1, categoryId: 1, expenseDate: -1, createdAt: -1 });
    await expectIndex(Expense.collection, { userId: 1, amount: -1, createdAt: -1 });
    await expectIndex(mongoose.connection.collection('income'), { userId: 1, incomeDate: -1, createdAt: -1 });
    await expectIndex(mongoose.connection.collection('income'), { userId: 1, amount: -1, createdAt: -1 });
    await expectIndex(Budget.collection, { userId: 1, year: 1, month: 1 });
    await expectIndex(Budget.collection, { userId: 1, categoryId: 1, year: 1, month: 1 }, { unique: true });
    await expectIndex(
      mongoose.connection.collection('recurring_expenses'),
      { userId: 1, active: 1, nextDate: 1 },
    );
    await expectIndex(
      mongoose.connection.collection('notifications'),
      { userId: 1, isRead: 1, createdAt: -1 },
    );
  });
});

async function createUser(email) {
  return User.create({
    email,
    passwordHash: 'not-a-login-hash',
  });
}

async function expectNotFound(promise) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.statusCode, 404);
    return true;
  });
}

async function expectIndex(collection, key, { unique = false } = {}) {
  const indexes = await collection.indexes();
  const match = indexes.some((index) => {
    const sameKey = JSON.stringify(index.key) === JSON.stringify(key);
    return sameKey && (!unique || index.unique === true);
  });

  assert.equal(match, true, `Missing index ${JSON.stringify(key)} on ${collection.collectionName}`);
}
