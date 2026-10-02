import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Category } from '../src/models/Category.js';
import { Profile } from '../src/models/Profile.js';
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

describe('settings', () => {
  it('saves account preferences for the signed-in user', async () => {
    const userA = await createUser('settings-a@example.com', 'Aung Aung');
    const userB = await createUser('settings-b@example.com', 'Other Person');
    const food = await categoryId(userA.id, 'Food');

    const missing = await request('/api/profile');
    assert.equal(missing.status, 401);

    const current = await request(`/api/profile?userId=${userB.id}`, { token: userA.token });
    assert.equal(current.status, 200);
    assert.equal(current.body.data.profile.fullName, 'Aung Aung');
    assert.equal(current.body.data.profile.currency, 'MMK');
    assert.equal(current.body.data.profile.notifyBudgets, true);
    assert.equal(current.body.data.profile.notifyRecurring, true);
    assert.equal(current.body.data.profile.notifyReports, true);
    assert.equal(JSON.stringify(current.body).includes('userId'), false);

    const invalid = await request('/api/profile', {
      method: 'PUT',
      token: userA.token,
      body: { currency: 'XYZ' },
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.errors.currency, 'Currency is not supported');

    const updated = await request('/api/profile', {
      method: 'PUT',
      token: userA.token,
      body: {
        userId: String(userB.id),
        fullName: 'Updated Name',
        currency: 'usd',
        notifyBudgets: false,
        notifyReports: false,
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.profile.fullName, 'Updated Name');
    assert.equal(updated.body.data.profile.currency, 'USD');
    assert.equal(updated.body.data.profile.notifyBudgets, false);
    assert.equal(updated.body.data.profile.notifyReports, false);
    assert.equal(updated.body.data.profile.notifyRecurring, true);
    assert.equal(JSON.stringify(updated.body).includes('userId'), false);

    const me = await request('/api/auth/me', { token: userA.token });
    assert.equal(me.body.data.user.fullName, 'Updated Name');
    assert.equal(me.body.data.user.currency, 'USD');
    assert.equal(me.body.data.user.notifyBudgets, false);

    const other = await request('/api/profile', { token: userB.token });
    assert.equal(other.body.data.profile.fullName, 'Other Person');
    assert.equal(other.body.data.profile.currency, 'MMK');

    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();
    const expenseDate = now.toISOString().slice(0, 10);

    await request('/api/budgets', {
      method: 'POST',
      token: userA.token,
      body: { categoryId: String(food), amount: 10000, month, year },
    });
    await request('/api/expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        categoryId: String(food),
        amount: 8000,
        description: 'Dinner',
        expenseDate,
      },
    });

    const quiet = await request('/api/notifications', { token: userA.token });
    const quietMessages = quiet.body.data.notifications.map((item) => item.message);
    assert.equal(quietMessages.some((message) => message.includes('Food budget')), false);
    assert.equal(quietMessages.some((message) => message.includes('report is ready')), false);

    await request('/api/profile', {
      method: 'PUT',
      token: userA.token,
      body: { notifyBudgets: true, notifyReports: true },
    });
    const restored = await request('/api/notifications', { token: userA.token });
    const restoredMessages = restored.body.data.notifications.map((item) => item.message);
    assert.equal(restoredMessages.includes('You have used 80% of your Food budget.'), true);
    assert.equal(restoredMessages.some((message) => message.includes('report is ready') && message.includes('8,000 USD')), true);
  });
});

function categoryId(userId, name) {
  return Category.findOne({ userId, name }).lean().then((category) => category._id);
}

async function createUser(email, fullName) {
  const user = await User.create({
    email,
    passwordHash: 'not-a-login-hash',
  });
  await Profile.create({ userId: user._id, fullName });
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
