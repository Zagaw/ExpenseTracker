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

describe('expenses', () => {
  it('lets a user manage only their own expenses', async () => {
    const userA = await createUser('expense-api-a@example.com');
    const userB = await createUser('expense-api-b@example.com');
    const food = await Category.findOne({ userId: userA.id, name: 'Food' }).lean();
    const transport = await Category.findOne({ userId: userA.id, name: 'Transport' }).lean();
    const otherFood = await Category.findOne({ userId: userB.id, name: 'Food' }).lean();

    const missingToken = await request('/api/expenses');
    assert.equal(missingToken.status, 401);

    const created = await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        userId: String(userB.id),
        category_id: String(food._id),
        amount: 15000,
        description: 'Dinner',
        expense_date: '2026-09-28',
        payment_method: 'cash',
        notes: 'Dinner with friends',
      },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.data.expense.amount, 15000);
    assert.equal(created.body.data.expense.category.name, 'Food');
    assert.equal(JSON.stringify(created.body).includes('password'), false);
    assert.equal(created.body.data.expense.userId, undefined);

    const second = await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(transport._id),
        amount: 4000,
        description: 'Taxi',
        expenseDate: '2026-09-02',
        paymentMethod: 'card',
      },
    });
    assert.equal(second.status, 201);

    const hidden = await request('/api/expenses', {
      method: 'POST',
      token: userB.token,
      body: {
        categoryId: String(food._id),
        amount: 1000,
        description: 'Stolen category',
        expenseDate: '2026-09-03',
      },
    });
    assert.equal(hidden.status, 400);
    assert.equal(hidden.body.errors.categoryId, 'Category not found');

    const list = await request('/api/expenses?sort=amount_desc', { token: userA.token });
    assert.equal(list.status, 200);
    assert.equal(list.body.data.total, 2);
    assert.equal(list.body.data.expenses[0].description, 'Dinner');

    const otherList = await request('/api/expenses', { token: userB.token });
    assert.equal(otherList.body.data.total, 0);

    const byName = await request('/api/expenses?category=food', { token: userA.token });
    assert.equal(byName.body.data.total, 1);
    assert.equal(byName.body.data.expenses[0].description, 'Dinner');

    const byDate = await request('/api/expenses?from=2026-09-01&to=2026-09-15', { token: userA.token });
    assert.equal(byDate.body.data.total, 1);
    assert.equal(byDate.body.data.expenses[0].description, 'Taxi');

    const byPayment = await request('/api/expenses?paymentMethod=card', { token: userA.token });
    assert.equal(byPayment.body.data.expenses[0].description, 'Taxi');

    const bySearch = await request('/api/expenses?search=friends', { token: userA.token });
    assert.equal(bySearch.body.data.total, 1);

    const literalSearch = await request(`/api/expenses?search=${encodeURIComponent('.*')}`, {
      token: userA.token,
    });
    assert.equal(literalSearch.body.data.total, 0);

    const otherCategory = await request(`/api/expenses?category=${otherFood._id}`, {
      token: userA.token,
    });
    assert.equal(otherCategory.body.data.total, 0);

    const expenseId = created.body.data.expense.id;
    const forbiddenGet = await request(`/api/expenses/${expenseId}`, { token: userB.token });
    assert.equal(forbiddenGet.status, 404);

    const updated = await request(`/api/expenses/${expenseId}`, {
      method: 'PUT',
      token: userA.token,
      body: {
        userId: String(userB.id),
        description: 'Updated dinner',
        amount: 16000,
        categoryId: String(food._id),
        expenseDate: '2026-09-28',
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.expense.description, 'Updated dinner');

    const forbiddenUpdate = await request(`/api/expenses/${expenseId}`, {
      method: 'PUT',
      token: userB.token,
      body: { description: 'Stolen', amount: 1, categoryId: String(otherFood._id), expenseDate: '2026-09-28' },
    });
    assert.equal(forbiddenUpdate.status, 404);

    const removed = await request(`/api/expenses/${second.body.data.expense.id}`, {
      method: 'DELETE',
      token: userB.token,
    });
    assert.equal(removed.status, 404);

    const deleted = await request(`/api/expenses/${second.body.data.expense.id}`, {
      method: 'DELETE',
      token: userA.token,
    });
    assert.equal(deleted.status, 200);

    const afterDelete = await request('/api/expenses', { token: userA.token });
    assert.equal(afterDelete.body.data.total, 1);

    const invalid = await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        amount: 0,
        expenseDate: '2026-02-31',
      },
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.errors.amount, 'Amount must be greater than 0');
    assert.equal(invalid.body.errors.categoryId, 'Category is required');
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
