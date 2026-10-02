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

describe('reports', () => {
  it('reports the signed-in user for a month, year, and custom range', async () => {
    const userA = await createUser('reports-api-a@example.com');
    const userB = await createUser('reports-api-b@example.com');
    const food = await Category.findOne({ userId: userA.id, name: 'Food' }).lean();
    const transport = await Category.findOne({ userId: userA.id, name: 'Transport' }).lean();
    const now = new Date();
    const today = dateOnly(now);
    const currentKey = today.slice(0, 7);
    const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();

    const missingToken = await request('/api/reports/monthly');
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
        expenseDate: today,
      },
    });
    await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: { amount: 50000, source: 'Salary', incomeDate: today },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(food._id),
        amount: 8000,
        description: 'Old dinner',
        expenseDate: '2000-06-15',
      },
    });
    await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: { amount: 12000, source: 'Bonus', incomeDate: '2001-01-10' },
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

    const monthly = await request(`/api/reports/monthly?userId=${userB.id}`, { token: userA.token });
    assert.equal(monthly.status, 200);
    assert.equal(monthly.body.data.period.type, 'month');
    assert.equal(monthly.body.data.period.month, now.getUTCMonth() + 1);
    assert.equal(monthly.body.data.period.year, now.getUTCFullYear());
    assert.equal(monthly.body.data.summary.income, 50000);
    assert.equal(monthly.body.data.summary.expenses, 30000);
    assert.equal(monthly.body.data.summary.balance, 20000);
    assert.equal(monthly.body.data.summary.expenseCount, 2);
    assert.equal(monthly.body.data.summary.incomeCount, 1);
    assert.equal(monthly.body.data.summary.averageDailySpending, Math.round(30000 / now.getUTCDate()));
    assert.deepEqual(monthly.body.data.summary.topCategory, { name: 'Food', amount: 20000 });
    assert.equal(JSON.stringify(monthly.body).includes('userId'), false);

    const categoryReport = await request('/api/reports/categories', { token: userA.token });
    assert.equal(categoryReport.body.data.total, 30000);
    assert.deepEqual(categoryReport.body.data.categories, [
      { name: 'Food', amount: 20000, color: '#0F766E', icon: 'utensils', count: 1, percentage: 67 },
      { name: 'Transport', amount: 10000, color: '#1D4ED8', icon: 'car', count: 1, percentage: 33 },
    ]);

    const trend = await request('/api/reports/trends', { token: userA.token });
    assert.equal(trend.body.data.grain, 'day');
    assert.equal(trend.body.data.spendingTrend.length, daysInMonth);
    assert.equal(trend.body.data.spendingTrend.find((day) => day.key === today).amount, 30000);
    assert.equal(trend.body.data.incomeVsExpenses.find((day) => day.key === today).income, 50000);
    assert.equal(trend.body.data.incomeVsExpenses.find((day) => day.key.startsWith(`${currentKey}-`) && day.key !== today).expenses, 0);

    const year = await request('/api/reports/monthly?year=2001', { token: userA.token });
    assert.equal(year.body.data.period.type, 'year');
    assert.equal(year.body.data.period.label, '2001');
    assert.equal(year.body.data.summary.income, 12000);
    assert.equal(year.body.data.summary.expenses, 0);
    assert.equal(year.body.data.summary.balance, 12000);

    const yearTrend = await request('/api/reports/trends?year=2000', { token: userA.token });
    assert.equal(yearTrend.body.data.grain, 'month');
    assert.equal(yearTrend.body.data.spendingTrend.length, 12);
    assert.equal(yearTrend.body.data.spendingTrend.find((month) => month.key === '2000-06').amount, 8000);
    assert.equal(yearTrend.body.data.spendingTrend.find((month) => month.key === '2000-01').amount, 0);

    const custom = await request('/api/reports/monthly?date_from=2000-06-10&date_to=2000-06-20', { token: userA.token });
    assert.equal(custom.body.data.period.type, 'custom');
    assert.equal(custom.body.data.period.from, '2000-06-10');
    assert.equal(custom.body.data.period.to, '2000-06-20');
    assert.equal(custom.body.data.summary.expenses, 8000);
    assert.equal(custom.body.data.summary.averageDailySpending, Math.round(8000 / 11));

    const customTrend = await request('/api/reports/trends?date_from=2000-06-10&date_to=2000-06-20', { token: userA.token });
    assert.equal(customTrend.body.data.grain, 'day');
    assert.equal(customTrend.body.data.spendingTrend.length, 11);
    assert.equal(customTrend.body.data.spendingTrend.find((day) => day.key === '2000-06-15').amount, 8000);

    const wide = await request('/api/reports/trends?date_from=2000-01-01&date_to=2000-08-01', { token: userA.token });
    assert.equal(wide.body.data.grain, 'month');
    assert.equal(wide.body.data.spendingTrend.find((month) => month.key === '2000-06').amount, 8000);

    const other = await request('/api/reports/monthly', { token: userB.token });
    assert.equal(other.body.data.summary.expenses, 999999);
    assert.equal(other.body.data.summary.income, 0);
  });

  it('rejects invalid report periods', async () => {
    const user = await createUser('reports-api-invalid@example.com');

    const badDate = await request('/api/reports/monthly?date_from=2000-02-31&date_to=2000-03-01', { token: user.token });
    assert.equal(badDate.status, 400);
    assert.equal(badDate.body.errors.date_from, 'Start date is not valid');

    const backwards = await request('/api/reports/categories?date_from=2000-06-20&date_to=2000-06-10', { token: user.token });
    assert.equal(backwards.status, 400);
    assert.equal(backwards.body.errors.date_to, 'End date must be on or after the start date');

    const tooLong = await request('/api/reports/trends?date_from=2000-01-01&date_to=2005-01-02', { token: user.token });
    assert.equal(tooLong.status, 400);
    assert.equal(tooLong.body.errors.date_to, 'Date range must be 5 years or shorter');

    const mixed = await request('/api/reports/monthly?month=6&date_from=2000-06-01&date_to=2000-06-30', { token: user.token });
    assert.equal(mixed.status, 400);

    const monthOnly = await request('/api/reports/monthly?month=6', { token: user.token });
    assert.equal(monthOnly.status, 400);
    assert.equal(monthOnly.body.errors.year, 'Year is not valid');

    const badMonth = await request('/api/reports/monthly?month=13&year=2000', { token: user.token });
    assert.equal(badMonth.status, 400);
    assert.equal(badMonth.body.errors.month, 'Month must be between 1 and 12');
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
