import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Category } from '../src/models/Category.js';
import { RecurringExpense } from '../src/models/RecurringExpense.js';
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

describe('notifications', () => {
  it('creates budget, recurring, and monthly report notices for the signed-in user', async () => {
    const userA = await createUser('notifications-api-a@example.com');
    const userB = await createUser('notifications-api-b@example.com');
    const food = await categoryId(userA.id, 'Food');
    const entertainment = await categoryId(userA.id, 'Entertainment');
    const now = new Date();
    const today = dateOnly(now);
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    const missingToken = await request('/api/notifications');
    assert.equal(missingToken.status, 401);

    await expense(userA.token, food, 12000, 'Lunch', today, userB.id);
    await expense(userA.token, entertainment, 91000, 'Show', today);
    await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: { amount: 50000, source: 'Salary', incomeDate: today },
    });
    await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: { categoryId: String(food), amount: 10000, month, year },
    });
    await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: { categoryId: String(entertainment), amount: 100000, month, year },
    });
    await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: { categoryId: null, amount: 1000000, month, year },
    });
    await RecurringExpense.create({
      userId: userA.id,
      amount: 15000,
      description: 'Rent',
      frequency: 'monthly',
      nextDate: new Date(`${today}T00:00:00.000Z`),
      paymentMethod: 'cash',
      active: true,
    });
    await RecurringExpense.create({
      userId: userA.id,
      amount: 5000,
      description: 'Later bill',
      frequency: 'monthly',
      nextDate: new Date(Date.UTC(year, month - 1, now.getUTCDate() + 10)),
      paymentMethod: 'cash',
      active: true,
    });
    await RecurringExpense.create({
      userId: userA.id,
      amount: 4000,
      description: 'Paused rent',
      frequency: 'monthly',
      nextDate: new Date(`${today}T00:00:00.000Z`),
      paymentMethod: 'cash',
      active: false,
    });
    await RecurringExpense.create({
      userId: userB.id,
      amount: 9000,
      description: 'Other rent',
      frequency: 'monthly',
      nextDate: new Date(`${today}T00:00:00.000Z`),
      paymentMethod: 'cash',
      active: true,
    });

    const first = await request(`/api/notifications?userId=${userB.id}`, { token: userA.token });
    assert.equal(first.status, 200);
    const messages = first.body.data.notifications.map((item) => item.message);
    assert.equal(messages.includes('You have used 120% of your Food budget.'), true);
    assert.equal(messages.includes('You have used 91% of your Entertainment budget.'), true);
    assert.equal(messages.includes('You have used 10% of your monthly budget.'), false);
    assert.equal(messages.includes('Rent is due today.'), false);
    assert.equal(messages.some((message) => message.includes('Later bill')), false);
    assert.equal(messages.some((message) => message.includes('Paused rent')), false);
    assert.equal(messages.some((message) => message.includes('Other rent')), false);
    assert.equal(
      messages.includes(`Your ${monthLabel} report is ready. Income 50,000 MMK, expenses 118,000 MMK.`),
      true,
    );
    assert.equal(first.body.data.notifications.every((item) => item.isRead === false), true);
    assert.equal(JSON.stringify(first.body).includes('userId'), false);
    assert.equal(JSON.stringify(first.body).includes('dedupeKey'), false);

    const second = await request('/api/notifications', { token: userA.token });
    assert.equal(second.body.data.notifications.length, first.body.data.notifications.length);

    const unread = await request('/api/notifications/unread-count', { token: userA.token });
    assert.equal(unread.body.data.unreadCount, first.body.data.notifications.length);

    const foodNotice = first.body.data.notifications.find((item) => item.message.includes('Food budget'));
    const marked = await request(`/api/notifications/${foodNotice.id}/read`, {
      method: 'PATCH',
      token: userA.token,
    });
    assert.equal(marked.status, 200);
    assert.equal(marked.body.data.notification.isRead, true);

    const stolen = await request(`/api/notifications/${foodNotice.id}/read`, {
      method: 'PATCH',
      token: userB.token,
    });
    assert.equal(stolen.status, 404);

    const afterOne = await request('/api/notifications/unread-count', { token: userA.token });
    assert.equal(afterOne.body.data.unreadCount, first.body.data.notifications.length - 1);

    const all = await request('/api/notifications/read-all', { method: 'PATCH', token: userA.token });
    assert.equal(all.status, 200);
    assert.equal(all.body.data.updated, first.body.data.notifications.length - 1);
    const afterAll = await request('/api/notifications/unread-count', { token: userA.token });
    assert.equal(afterAll.body.data.unreadCount, 0);

    const removed = await request(`/api/notifications/${foodNotice.id}`, {
      method: 'DELETE',
      token: userA.token,
    });
    assert.equal(removed.status, 200);
    assert.equal(removed.body.data.id, foodNotice.id);

    const missing = await request(`/api/notifications/${foodNotice.id}`, {
      method: 'DELETE',
      token: userB.token,
    });
    assert.equal(missing.status, 404);

    const remaining = await request('/api/notifications', { token: userA.token });
    assert.equal(remaining.body.data.notifications.some((item) => item.id === foodNotice.id), false);

    const other = await request('/api/notifications', { token: userB.token });
    assert.deepEqual(other.body.data.notifications.map((item) => item.message), [
      `Your ${monthLabel} report is ready. Income 0 MMK, expenses 9,000 MMK.`,
    ]);
  });
});

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function categoryId(userId, name) {
  return Category.findOne({ userId, name }).lean().then((category) => category._id);
}

function expense(token, category, amount, description, expenseDate, foreignUserId) {
  return request('/api/expenses', {
    method: 'POST',
    token,
    body: {
      ...(foreignUserId ? { userId: String(foreignUserId) } : {}),
      categoryId: String(category),
      amount,
      description,
      expenseDate,
    },
  });
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
