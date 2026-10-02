import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Category } from '../src/models/Category.js';
import { User } from '../src/models/User.js';
import { syncModelIndexes } from '../src/models/index.js';
import { categoryService } from '../src/services/categoryService.js';
import { app } from '../src/server.js';

let server;

before(async () => {
  await connectDatabase();

  if (mongoose.connection.name !== 'expense-tracker-test') {
    throw new Error(`Refusing to run tests against "${mongoose.connection.name}"`);
  }

  await mongoose.connection.dropDatabase();
  await syncModelIndexes();

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

describe('budgets', () => {
  it('tracks monthly and category budgets for the signed-in user', async () => {
    const userA = await createUser('budget-api-a@example.com');
    const userB = await createUser('budget-api-b@example.com');
    const food = await Category.findOne({ userId: userA.id, name: 'Food' }).lean();
    const transport = await Category.findOne({ userId: userA.id, name: 'Transport' }).lean();
    const otherFood = await Category.findOne({ userId: userB.id, name: 'Food' }).lean();
    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    const today = dateOnly(now);

    const missingToken = await request('/api/budgets');
    assert.equal(missingToken.status, 401);

    const overall = await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: {
        userId: String(userB.id),
        categoryId: null,
        amount: 100000,
        month,
        year,
      },
    });
    assert.equal(overall.status, 201);
    assert.equal(overall.body.data.budget.category, null);
    assert.equal(overall.body.data.budget.userId, undefined);
    assert.equal(overall.body.data.budget.spent, 0);
    assert.equal(overall.body.data.budget.status, 'normal');

    const duplicate = await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: { amount: 50000, month, year, categoryId: null },
    });
    assert.equal(duplicate.status, 409);

    const foreignCategory = await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: { amount: 10000, month, year, categoryId: String(otherFood._id) },
    });
    assert.equal(foreignCategory.status, 400);
    assert.equal(foreignCategory.body.errors.categoryId, 'Category not found');

    const foodBudget = await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: { amount: 50000, month, year, category_id: String(food._id) },
    });
    assert.equal(foodBudget.status, 201);
    assert.equal(foodBudget.body.data.budget.category.name, 'Food');

    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(food._id),
        amount: 45000,
        description: 'Dinner',
        expenseDate: today,
      },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(transport._id),
        amount: 25000,
        description: 'Taxi',
        expenseDate: today,
      },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(food._id),
        amount: 99999,
        description: 'Old dinner',
        expenseDate: '2000-06-15',
      },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userB.token,
      body: {
        categoryId: String(otherFood._id),
        amount: 80000,
        description: 'Other dinner',
        expenseDate: today,
      },
    });

    const list = await request(`/api/budgets?month=${month}&year=${year}`, { token: userA.token });
    assert.equal(list.body.data.budgets.length, 2);
    assert.equal(list.body.data.budgets[0].category, null);
    assert.equal(list.body.data.budgets[0].spent, 70000);
    assert.equal(list.body.data.budgets[0].remaining, 30000);
    assert.equal(list.body.data.budgets[0].percentage, 70);
    assert.equal(list.body.data.budgets[0].status, 'warning');
    const foodRow = list.body.data.budgets.find((budget) => budget.category?.name === 'Food');
    assert.equal(foodRow.spent, 45000);
    assert.equal(foodRow.remaining, 5000);
    assert.equal(foodRow.percentage, 90);
    assert.equal(foodRow.status, 'danger');

    const summary = await request(`/api/budgets/progress?month=${month}&year=${year}`, { token: userA.token });
    assert.deepEqual(summary.body.data.progress, {
      budget: 100000,
      spent: 70000,
      remaining: 30000,
      percentage: 70,
      status: 'warning',
      month,
      year,
    });

    const otherList = await request(`/api/budgets?month=${month}&year=${year}`, { token: userB.token });
    assert.equal(otherList.body.data.budgets.length, 0);

    const forbidden = await request(`/api/budgets/${foodBudget.body.data.budget.id}`, { token: userB.token });
    assert.equal(forbidden.status, 404);

    const updated = await request(`/api/budgets/${foodBudget.body.data.budget.id}`, {
      method: 'PUT',
      token: userA.token,
      body: { amount: 90000 },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.budget.amount, 90000);
    assert.equal(updated.body.data.budget.percentage, 50);
    assert.equal(updated.body.data.budget.status, 'normal');

    await assertStatus(userA.token, String(food._id), 1, 100, 69, 69, 'normal', 31);
    await assertStatus(userA.token, String(food._id), 2, 100, 70, 70, 'warning', 30);
    await assertStatus(userA.token, String(food._id), 3, 100, 90, 90, 'danger', 10);
    await assertStatus(userA.token, String(food._id), 4, 100, 120, 120, 'exceeded', -20);

    const removed = await request(`/api/budgets/${foodBudget.body.data.budget.id}`, {
      method: 'DELETE',
      token: userB.token,
    });
    assert.equal(removed.status, 404);
    const deleted = await request(`/api/budgets/${foodBudget.body.data.budget.id}`, {
      method: 'DELETE',
      token: userA.token,
    });
    assert.equal(deleted.status, 200);

    const afterDelete = await request(`/api/budgets?month=${month}&year=${year}`, { token: userA.token });
    assert.equal(afterDelete.body.data.budgets.length, 1);
    assert.equal(afterDelete.body.data.budgets[0].category, null);

    const dashboard = await request('/api/dashboard/summary', { token: userA.token });
    assert.equal(dashboard.body.data.budgets.some((budget) => budget.category === null), true);
    assert.equal(dashboard.body.data.budgets[0].spent, 70000);
  });
});

async function assertStatus(token, categoryId, month, amount, spent, percentage, status, remaining) {
  const created = await request('/api/budgets', {
    method: 'POST',
    token,
    body: { amount, month, year: 2001, categoryId: null },
  });
  assert.equal(created.status, 201);
  const expense = await request('/api/expenses', {
    method: 'POST',
    token,
    body: {
      categoryId,
      amount: spent,
      description: `Status ${month}`,
      expenseDate: `2001-${String(month).padStart(2, '0')}-15`,
    },
  });
  assert.equal(expense.status, 201);
  const progress = await request(`/api/budgets/progress?month=${month}&year=2001`, { token });
  assert.equal(progress.body.data.progress.percentage, percentage);
  assert.equal(progress.body.data.progress.status, status);
  assert.equal(progress.body.data.progress.remaining, remaining);
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

async function createUser(email) {
  const user = await User.create({
    email,
    passwordHash: 'not-a-login-hash',
  });
  await categoryService.ensureDefaultCategories(user._id);

  return {
    id: user._id,
    token: jwt.sign(
      { userId: String(user._id), email: user.email },
      env.jwtSecret,
      { expiresIn: '1h' },
    ),
  };
}

async function request(pathname, { method = 'GET', body, token } = {}) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}
