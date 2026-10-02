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

describe('csv export', () => {
  it('exports the signed-in user expenses as a spreadsheet file', async () => {
    const userA = await createUser('export-a@example.com');
    const userB = await createUser('export-b@example.com');
    const food = await categoryId(userA.id, 'Food');
    const transport = await categoryId(userA.id, 'Transport');

    const missing = await request('/api/expenses/export');
    assert.equal(missing.status, 401);

    await expense(userA.token, food, 5000, 'Lunch, "team"', '2026-09-02', 'card', 'private-note');
    await expense(userA.token, transport, 9000, '=SUM(A1)', '2026-09-10', 'cash', '');
    await expense(userA.token, food, 1000, 'Old snack', '2026-08-01', 'cash', '');
    await expense(userB.token, await categoryId(userB.id, 'Food'), 10, 'Foreign lunch', '2026-09-02', 'cash', '');

    const file = await request(`/api/expenses/export?userId=${userB.id}&from=2026-09-01&to=2026-09-30&sort=amount_desc`, {
      token: userA.token,
    });
    assert.equal(file.status, 200);
    assert.match(file.contentType, /text\/csv/);
    assert.match(file.disposition, /attachment; filename="expenses-\d{4}-\d{2}-\d{2}\.csv"/);
    assert.equal(file.text, [
      'Date,Description,Category,Payment Method,Amount',
      "2026-09-10,'=SUM(A1),Transport,Cash,9000",
      '2026-09-02,"Lunch, ""team""",Food,Card,5000',
      '',
    ].join('\n'));
    assert.equal(file.text.includes('Foreign lunch'), false);
    assert.equal(file.text.includes('Old snack'), false);
    assert.equal(file.text.includes('private-note'), false);
    assert.equal(file.text.includes(String(userA.id)), false);

    const searched = await request('/api/expenses/export?search=lunch', { token: userA.token });
    assert.equal(searched.text.includes('Lunch, ""team""'), true);
    assert.equal(searched.text.includes('=SUM(A1)'), false);

    await categoryService.deleteCategory(userA.id, food);
    const uncategorized = await request('/api/expenses/export?search=lunch', { token: userA.token });
    assert.equal(uncategorized.text.includes('Uncategorized'), true);
    assert.equal(uncategorized.text.includes(',Food,'), false);

    const invalid = await request('/api/expenses/export?from=2026-02-31', { token: userA.token });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.errors.from, 'A valid date is required');
  });
});

function categoryId(userId, name) {
  return Category.findOne({ userId, name }).lean().then((category) => category._id);
}

function expense(token, category, amount, description, expenseDate, paymentMethod, notes) {
  return request('/api/expenses', {
    method: 'POST',
    token,
    body: {
      categoryId: String(category),
      amount,
      description,
      expenseDate,
      paymentMethod,
      notes,
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
  const contentType = response.headers.get('content-type') || '';

  return {
    status: response.status,
    text,
    contentType,
    disposition: response.headers.get('content-disposition') || '',
    body: contentType.includes('application/json') && text ? JSON.parse(text) : null,
  };
}
