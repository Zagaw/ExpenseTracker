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

describe('income', () => {
  it('keeps income private and includes it in the balance', async () => {
    const userA = await createUser('income-api-a@example.com');
    const userB = await createUser('income-api-b@example.com');
    const housing = await Category.findOne({ userId: userA.id, name: 'Housing' }).lean();

    const missingToken = await request('/api/income');
    assert.equal(missingToken.status, 401);

    const emptySummary = await request('/api/dashboard/summary', { token: userA.token });
    assert.equal(emptySummary.status, 200);
    assert.equal(emptySummary.body.data.summary.balance, 0);
    assert.equal(emptySummary.body.data.summary.totalIncome, 0);
    assert.equal(emptySummary.body.data.summary.totalExpenses, 0);
    assert.equal(emptySummary.body.data.summary.monthlyExpenses, 0);
    assert.equal(emptySummary.body.data.summary.topCategory, null);

    const salary = await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: {
        userId: String(userB.id),
        amount: 600000,
        source: 'Salary',
        description: 'September salary',
        income_date: '2026-09-01',
      },
    });
    assert.equal(salary.status, 201);
    assert.equal(salary.body.data.income.amount, 600000);
    assert.equal(salary.body.data.income.source, 'Salary');
    assert.equal(salary.body.data.income.userId, undefined);

    const bonus = await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: {
        amount: 50000,
        source: 'Bonus',
        description: 'Yearly bonus',
        incomeDate: '2026-09-20',
      },
    });
    assert.equal(bonus.status, 201);

    const hidden = await request('/api/income', {
      method: 'POST',
      token: userB.token,
      body: {
        amount: 999999,
        source: 'Other salary',
        incomeDate: '2026-09-02',
      },
    });
    assert.equal(hidden.status, 201);

    const list = await request('/api/income?sort=amount_desc', { token: userA.token });
    assert.equal(list.body.data.total, 2);
    assert.equal(list.body.data.totalAmount, 650000);
    assert.equal(list.body.data.income[0].source, 'Salary');

    const otherList = await request('/api/income', { token: userB.token });
    assert.equal(otherList.body.data.total, 1);
    assert.equal(otherList.body.data.totalAmount, 999999);

    const bySearch = await request('/api/income?search=yearly', { token: userA.token });
    assert.equal(bySearch.body.data.total, 1);
    assert.equal(bySearch.body.data.income[0].source, 'Bonus');

    const literalSearch = await request(`/api/income?search=${encodeURIComponent('.*')}`, {
      token: userA.token,
    });
    assert.equal(literalSearch.body.data.total, 0);
    assert.equal(literalSearch.body.data.totalAmount, 0);

    const byDate = await request('/api/income?from=2026-09-15&to=2026-09-30', { token: userA.token });
    assert.equal(byDate.body.data.total, 1);
    assert.equal(byDate.body.data.income[0].source, 'Bonus');

    const incomeId = salary.body.data.income.id;
    const forbiddenGet = await request(`/api/income/${incomeId}`, { token: userB.token });
    assert.equal(forbiddenGet.status, 404);

    const updated = await request(`/api/income/${incomeId}`, {
      method: 'PUT',
      token: userA.token,
      body: {
        userId: String(userB.id),
        source: 'Monthly salary',
        amount: 610000,
        incomeDate: '2026-09-01',
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.income.source, 'Monthly salary');
    assert.equal(updated.body.data.income.amount, 610000);

    const forbiddenUpdate = await request(`/api/income/${incomeId}`, {
      method: 'PUT',
      token: userB.token,
      body: { source: 'Stolen', amount: 1, incomeDate: '2026-09-01' },
    });
    assert.equal(forbiddenUpdate.status, 404);

    const expense = await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(housing._id),
        amount: 350000,
        description: 'Rent',
        expenseDate: '2026-09-05',
      },
    });
    assert.equal(expense.status, 201);

    const summary = await request('/api/dashboard/summary', { token: userA.token });
    assert.equal(summary.body.data.summary.balance, 310000);
    assert.equal(summary.body.data.summary.totalIncome, 660000);
    assert.equal(summary.body.data.summary.totalExpenses, 350000);

    const otherSummary = await request('/api/dashboard/summary', { token: userB.token });
    assert.equal(otherSummary.body.data.summary.balance, 999999);
    assert.equal(otherSummary.body.data.summary.totalExpenses, 0);

    const removed = await request(`/api/income/${bonus.body.data.income.id}`, {
      method: 'DELETE',
      token: userB.token,
    });
    assert.equal(removed.status, 404);

    const deleted = await request(`/api/income/${bonus.body.data.income.id}`, {
      method: 'DELETE',
      token: userA.token,
    });
    assert.equal(deleted.status, 200);

    const afterDelete = await request('/api/dashboard/summary', { token: userA.token });
    assert.equal(afterDelete.body.data.summary.balance, 260000);
    assert.equal(afterDelete.body.data.summary.totalIncome, 610000);
    assert.equal(afterDelete.body.data.summary.totalExpenses, 350000);

    const invalid = await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: {
        amount: 0,
        incomeDate: '2026-02-31',
      },
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.errors.amount, 'Amount must be greater than 0');
    assert.equal(invalid.body.errors.source, 'Source is required');
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
