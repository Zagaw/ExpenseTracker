import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Expense } from '../src/models/Expense.js';
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

describe('categories', () => {
  it('lets a user manage categories and keeps spending after deletion', async () => {
    const userA = await createUser('category-api-a@example.com');
    const userB = await createUser('category-api-b@example.com');

    const missingToken = await request('/api/categories');
    assert.equal(missingToken.status, 401);

    const initial = await request('/api/categories', { token: userA.token });
    assert.equal(initial.status, 200);
    assert.equal(initial.body.data.categories.length, 10);
    assert.equal(initial.body.data.uncategorizedSpent, 0);
    assert.equal(initial.body.data.categories.find((category) => category.name === 'Food').spent, 0);
    assert.equal(JSON.stringify(initial.body).includes('userId'), false);

    const created = await request('/api/categories', {
      method: 'POST',
      token: userA.token,
      body: {
        userId: String(userB.id),
        name: 'Pets',
        icon: 'Dog',
        color: '#15803d',
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.data.category.name, 'Pets');
    assert.equal(created.body.data.category.icon, 'dog');
    assert.equal(created.body.data.category.color, '#15803D');
    assert.equal(created.body.data.category.spent, 0);
    assert.equal(created.body.data.category.userId, undefined);

    const duplicate = await request('/api/categories', {
      method: 'POST',
      token: userA.token,
      body: { name: 'food', icon: 'utensils', color: '#112233' },
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.message, 'A category with this name already exists.');

    const invalid = await request('/api/categories', {
      method: 'POST',
      token: userA.token,
      body: { icon: 'rocket', color: 'red' },
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.errors.name, 'Category name is required');
    assert.equal(invalid.body.errors.icon, 'Icon is not valid');
    assert.equal(invalid.body.errors.color, 'Color must be a hex value');

    const categoryId = created.body.data.category.id;
    const forbiddenUpdate = await request(`/api/categories/${categoryId}`, {
      method: 'PUT',
      token: userB.token,
      body: { name: 'Stolen', icon: 'dog', color: '#15803D' },
    });
    assert.equal(forbiddenUpdate.status, 404);

    const updated = await request(`/api/categories/${categoryId}`, {
      method: 'PUT',
      token: userA.token,
      body: {
        userId: String(userB.id),
        name: 'Pet care',
        color: '#0F766E',
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.category.name, 'Pet care');
    assert.equal(updated.body.data.category.icon, 'dog');
    assert.equal(updated.body.data.category.color, '#0F766E');

    const food = initial.body.data.categories.find((category) => category.name === 'Food');
    const otherFood = (await request('/api/categories', { token: userB.token })).body.data.categories
      .find((category) => category.name === 'Food');

    const firstExpense = await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: food.id,
        amount: 15000,
        description: 'Dinner',
        expenseDate: '2026-09-28',
      },
    });
    assert.equal(firstExpense.status, 201);
    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: food.id,
        amount: 5000,
        description: 'Lunch',
        expenseDate: '2026-09-27',
      },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userB.token,
      body: {
        categoryId: otherFood.id,
        amount: 999,
        description: 'Other dinner',
        expenseDate: '2026-09-27',
      },
    });
    await Expense.create({
      userId: userB.id,
      categoryId: food.id,
      amount: 10,
      expenseDate: new Date('2026-09-02T00:00:00.000Z'),
      description: 'Foreign link',
    });

    const withSpending = await request('/api/categories', { token: userA.token });
    assert.equal(withSpending.body.data.categories.find((category) => category.name === 'Food').spent, 20000);
    assert.equal(withSpending.body.data.uncategorizedSpent, 0);

    const otherSpending = await request('/api/categories', { token: userB.token });
    assert.equal(otherSpending.body.data.categories.find((category) => category.name === 'Food').spent, 999);

    const forbiddenDelete = await request(`/api/categories/${food.id}`, {
      method: 'DELETE',
      token: userB.token,
    });
    assert.equal(forbiddenDelete.status, 404);

    const deleted = await request(`/api/categories/${food.id}`, {
      method: 'DELETE',
      token: userA.token,
    });
    assert.equal(deleted.status, 200);

    const afterDelete = await request('/api/categories', { token: userA.token });
    assert.equal(afterDelete.body.data.categories.some((category) => category.name === 'Food'), false);
    assert.equal(afterDelete.body.data.uncategorizedSpent, 20000);
    assert.equal(afterDelete.body.data.categories.some((category) => category.name === 'Pet care'), true);

    const expense = await request(`/api/expenses/${firstExpense.body.data.expense.id}`, { token: userA.token });
    assert.equal(expense.body.data.expense.category, null);

    const otherStillThere = await request('/api/categories', { token: userB.token });
    assert.equal(otherStillThere.body.data.categories.some((category) => category.name === 'Food'), true);
    assert.equal(otherStillThere.body.data.categories.find((category) => category.name === 'Food').spent, 999);
  });
});

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
