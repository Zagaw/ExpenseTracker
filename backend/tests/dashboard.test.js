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

describe('dashboard', () => {
  it('summarizes the signed-in user for the current month', async () => {
    const userA = await createUser('dashboard-api-a@example.com');
    const userB = await createUser('dashboard-api-b@example.com');
    const food = await Category.findOne({ userId: userA.id, name: 'Food' }).lean();
    const transport = await Category.findOne({ userId: userA.id, name: 'Transport' }).lean();
    const now = new Date();
    const today = dateOnly(now);
    const monthStart = dateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    const previousMonth = dateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15)));
    const currentKey = today.slice(0, 7);

    const missingToken = await request('/api/dashboard/summary');
    assert.equal(missingToken.status, 401);

    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        userId: String(userB.id),
        categoryId: String(food._id),
        amount: 20000,
        description: 'Dinner',
        expenseDate: today,
      },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(transport._id),
        amount: 10000,
        description: 'Taxi',
        expenseDate: monthStart,
      },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(transport._id),
        amount: 8000,
        description: 'Last month taxi',
        expenseDate: previousMonth,
      },
    });
    await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: {
        amount: 50000,
        source: 'Salary',
        incomeDate: today,
      },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userB.token,
      body: {
        categoryId: String((await Category.findOne({ userId: userB.id, name: 'Food' }).lean())._id),
        amount: 999999,
        description: 'Other dinner',
        expenseDate: today,
      },
    });

    const dashboard = await request('/api/dashboard/summary', { token: userA.token });
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.body.data.summary.balance, 12000);
    assert.equal(dashboard.body.data.summary.totalIncome, 50000);
    assert.equal(dashboard.body.data.summary.totalExpenses, 38000);
    assert.equal(dashboard.body.data.summary.monthlyExpenses, 30000);
    assert.equal(
      dashboard.body.data.summary.averageDailySpending,
      Math.round(30000 / now.getUTCDate()),
    );
    assert.deepEqual(dashboard.body.data.summary.topCategory, { name: 'Food', amount: 20000 });

    assert.equal(dashboard.body.data.charts.spendingTrend.length, 6);
    assert.equal(
      dashboard.body.data.charts.spendingTrend.find((month) => month.month === currentKey).amount,
      30000,
    );
    assert.deepEqual(dashboard.body.data.charts.categories, [
      { name: 'Food', amount: 20000, color: '#0F766E' },
      { name: 'Transport', amount: 10000, color: '#1D4ED8' },
    ]);
    assert.equal(
      dashboard.body.data.charts.incomeVsExpenses.find((month) => month.month === currentKey).income,
      50000,
    );
    assert.equal(
      dashboard.body.data.charts.incomeVsExpenses.find((month) => month.month === currentKey).expenses,
      30000,
    );

    assert.equal(dashboard.body.data.transactions[0].title, 'Salary');
    assert.equal(dashboard.body.data.transactions[0].type, 'income');
    assert.equal(dashboard.body.data.transactions.some((item) => item.title === 'Dinner'), true);
    assert.equal(dashboard.body.data.transactions.some((item) => item.title === 'Other dinner'), false);
    assert.equal(JSON.stringify(dashboard.body).includes('userId'), false);

    const other = await request('/api/dashboard/summary', { token: userB.token });
    assert.equal(other.body.data.summary.monthlyExpenses, 999999);
    assert.equal(other.body.data.summary.totalIncome, 0);
    assert.equal(other.body.data.transactions.some((item) => item.title === 'Dinner'), false);
  });
});

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
