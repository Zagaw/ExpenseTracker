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

describe('recurring expenses', () => {
  it('records each due date once and keeps other users out', async () => {
    const userA = await createUser('recurring-a@example.com');
    const userB = await createUser('recurring-b@example.com');
    const food = await categoryId(userA.id, 'Food');
    const now = new Date();
    const today = dateOnly(now);
    const tomorrow = dateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)));
    const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 31));
    const anchorDate = dateOnly(anchor);
    const expected = dueMonthly(anchor, now);

    const missing = await request('/api/recurring-expenses');
    assert.equal(missing.status, 401);

    const invalid = await request('/api/recurring-expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        amount: 1000,
        description: 'Bad',
        frequency: 'daily',
        nextDate: tomorrow,
        categoryId: String(food),
      },
    });
    assert.equal(invalid.status, 400);

    const future = await request('/api/recurring-expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        userId: String(userB.id),
        amount: 20000,
        description: 'Internet',
        frequency: 'monthly',
        nextDate: tomorrow,
        categoryId: String(food),
        paymentMethod: 'bank_transfer',
      },
    });
    assert.equal(future.status, 201);
    assert.equal(future.body.data.recurringExpense.description, 'Internet');
    assert.equal(future.body.data.recurringExpense.active, true);
    assert.equal(future.body.data.recurringExpense.category.name, 'Food');
    assert.equal(JSON.stringify(future.body).includes('userId'), false);
    assert.equal(dateOnly(new Date(future.body.data.recurringExpense.nextDate)), tomorrow);

    const paused = await request('/api/recurring-expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        amount: 4000,
        description: 'Paused gym',
        frequency: 'monthly',
        nextDate: anchorDate,
        categoryId: String(food),
        active: false,
      },
    });
    assert.equal(paused.status, 201);
    assert.equal(paused.body.data.recurringExpense.active, false);

    const membership = await request('/api/recurring-expenses', {
      method: 'POST',
      token: userA.token,
      body: {
        amount: 8000,
        description: 'Membership',
        frequency: 'monthly',
        nextDate: anchorDate,
        categoryId: String(food),
        paymentMethod: 'card',
      },
    });
    assert.equal(membership.status, 201);
    const membershipId = membership.body.data.recurringExpense.id;
    assert.equal(dateOnly(new Date(membership.body.data.recurringExpense.nextDate)), dateOnly(expected.next));

    const hidden = await request('/api/recurring-expenses', {
      method: 'POST',
      token: userB.token,
      body: {
        amount: 3000,
        description: 'Other subscription',
        frequency: 'weekly',
        nextDate: today,
        categoryId: String(await categoryId(userB.id, 'Food')),
      },
    });
    assert.equal(hidden.status, 201);

    const listed = await request('/api/recurring-expenses', { token: userA.token });
    assert.equal(listed.status, 200);
    const descriptions = listed.body.data.recurringExpenses.map((item) => item.description);
    assert.deepEqual(descriptions.sort(), ['Internet', 'Membership', 'Paused gym']);
    assert.equal(JSON.stringify(listed.body).includes('userId'), false);

    const generated = await expensesNamed(userA.token, 'Membership');
    assert.equal(generated.length, expected.dates.length);
    assert.equal(
      generated.some((item) => dateOnly(new Date(item.expenseDate)) === dateOnly(expected.dates[1])),
      true,
    );
    assert.equal((await expensesNamed(userA.token, 'Internet')).length, 0);
    assert.equal((await expensesNamed(userA.token, 'Paused gym')).length, 0);
    assert.equal((await expensesNamed(userA.token, 'Other subscription')).length, 0);

    const again = await request('/api/recurring-expenses', { token: userA.token });
    assert.equal(dateOnly(new Date(again.body.data.recurringExpenses.find((item) => item.id === membershipId).nextDate)), dateOnly(expected.next));
    assert.equal((await expensesNamed(userA.token, 'Membership')).length, expected.dates.length);

    const stolen = await request(`/api/recurring-expenses/${membershipId}/toggle`, {
      method: 'PATCH',
      token: userB.token,
    });
    assert.equal(stolen.status, 404);

    const pausedToggle = await request(`/api/recurring-expenses/${paused.body.data.recurringExpense.id}/toggle`, {
      method: 'PATCH',
      token: userA.token,
    });
    assert.equal(pausedToggle.status, 200);
    assert.equal(pausedToggle.body.data.recurringExpense.active, true);
    assert.equal((await expensesNamed(userA.token, 'Paused gym')).length, expected.dates.length);

    const edited = await request(`/api/recurring-expenses/${future.body.data.recurringExpense.id}`, {
      method: 'PUT',
      token: userA.token,
      body: { amount: 22000, description: 'Internet' },
    });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.data.recurringExpense.amount, 22000);

    const removed = await request(`/api/recurring-expenses/${membershipId}`, {
      method: 'DELETE',
      token: userA.token,
    });
    assert.equal(removed.status, 200);
    const afterDelete = await request('/api/recurring-expenses', { token: userA.token });
    assert.equal(afterDelete.body.data.recurringExpenses.some((item) => item.id === membershipId), false);
    assert.equal((await expensesNamed(userA.token, 'Membership')).length, expected.dates.length);

    const otherDelete = await request(`/api/recurring-expenses/${hidden.body.data.recurringExpense.id}`, {
      method: 'DELETE',
      token: userA.token,
    });
    assert.equal(otherDelete.status, 404);
  });
});

function dueMonthly(anchor, now) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const dates = [];

  for (let step = 0; step < 36; step += 1) {
    const date = addMonths(anchor, step);

    if (date > end) {
      break;
    }

    dates.push(date);
  }

  return { dates, next: addMonths(anchor, dates.length) };
}

function addMonths(anchor, steps) {
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const day = anchor.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + steps + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month + steps, Math.min(day, lastDay)));
}

function dateOnly(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function categoryId(userId, name) {
  return Category.findOne({ userId, name }).lean().then((category) => category._id);
}

async function expensesNamed(token, description) {
  const response = await request(`/api/expenses?search=${encodeURIComponent(description)}`, { token });
  assert.equal(response.status, 200);
  return response.body.data.expenses.filter((item) => item.description === description);
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
