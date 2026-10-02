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

describe('insights', () => {
  it('describes the signed-in user for the current month', async () => {
    const userA = await createUser('insights-api-a@example.com');
    const userB = await createUser('insights-api-b@example.com');
    const food = await categoryId(userA.id, 'Food');
    const transport = await categoryId(userA.id, 'Transport');
    const entertainment = await categoryId(userA.id, 'Entertainment');
    const now = new Date();
    const today = dateOnly(now);
    const previous = dateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15)));
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    const missingToken = await request('/api/insights');
    assert.equal(missingToken.status, 401);

    await expense(userA.token, food, 10000, 'Last dinner', previous);
    await expense(userA.token, food, 11500, 'Dinner', today, userB.id);
    await expense(userA.token, transport, 5000, 'Taxi', today);
    await request('/api/income', {
      method: 'POST',
      token: userA.token,
      body: { amount: 30000, source: 'Salary', incomeDate: today },
    });
    await expense(userB.token, await categoryId(userB.id, 'Food'), 999999, 'Other dinner', today);

    const insights = await request(`/api/insights?userId=${userB.id}`, { token: userA.token });
    assert.equal(insights.status, 200);
    assert.deepEqual(insights.body.data.insights.map((item) => item.type), [
      'spending_increase',
      'healthy_balance',
      'largest_category',
      'second_category',
      'daily_spending',
    ]);
    assert.equal(
      insights.body.data.insights[0].message,
      'Your Food spending is 15% higher than last month.',
    );
    assert.equal(
      insights.body.data.insights[1].message,
      'Your income is currently higher than your expenses this month.',
    );
    assert.equal(
      insights.body.data.insights[2].message,
      'Food is your largest category this month, at 11,500 MMK.',
    );
    assert.equal(
      insights.body.data.insights[3].message,
      'Transport is your second-largest category this month.',
    );
    assert.equal(
      insights.body.data.insights[4].message,
      `Your average daily spending is ${money(Math.round(16500 / now.getUTCDate()))}.`,
    );
    assert.equal(JSON.stringify(insights.body).includes('userId'), false);
    assert.equal(insights.body.data.insights.some((item) => item.message.includes('Other dinner')), false);

    const other = await request('/api/insights', { token: userB.token });
    assert.equal(other.body.data.insights.some((item) => item.message.includes('Food spending is 15%')), false);
    assert.equal(other.body.data.insights.some((item) => item.message.includes('999,999 MMK')), true);

    const budgetUser = await createUser('insights-api-budget@example.com');
    const budgetFood = await categoryId(budgetUser.id, 'Food');
    const budgetEntertainment = await categoryId(budgetUser.id, 'Entertainment');
    await expense(budgetUser.token, budgetEntertainment, 91000, 'Show', today);
    await expense(budgetUser.token, budgetFood, 12000, 'Lunch', today);
    await request('/api/budgets', {
      method: 'POST',
      token: budgetUser.token,
      body: { categoryId: String(budgetEntertainment), amount: 100000, month, year },
    });
    await request('/api/budgets', {
      method: 'POST',
      token: budgetUser.token,
      body: { categoryId: String(budgetFood), amount: 10000, month, year },
    });
    await request('/api/budgets', {
      method: 'POST',
      token: budgetUser.token,
      body: { categoryId: null, amount: 200000, month, year },
    });

    const budgetNotes = await request('/api/insights', { token: budgetUser.token });
    assert.equal(budgetNotes.body.data.insights[0].title, 'Budget exceeded');
    assert.equal(budgetNotes.body.data.insights[0].message, 'You have used 120% of your Food budget.');
    assert.equal(budgetNotes.body.data.insights[1].title, 'Budget warning');
    assert.equal(budgetNotes.body.data.insights[1].message, 'You have used 91% of your Entertainment budget.');
    assert.equal(
      budgetNotes.body.data.insights.find((item) => item.type === 'budget_usage').message,
      'You have used 52% of your monthly budget.',
    );

    const calm = await createUser('insights-api-calm@example.com');
    await expense(calm.token, await categoryId(calm.id, 'Food'), 40000, 'Groceries', today);
    await request('/api/budgets', {
      method: 'POST',
      token: calm.token,
      body: { categoryId: null, amount: 100000, month, year },
    });
    const calmNotes = await request('/api/insights', { token: calm.token });
    assert.equal(
      calmNotes.body.data.insights.find((item) => item.type === 'budget_usage').message,
      'You have used 40% of your monthly budget.',
    );

    const lower = await createUser('insights-api-lower@example.com');
    const lowerFood = await categoryId(lower.id, 'Food');
    await expense(lower.token, lowerFood, 10000, 'Old groceries', previous);
    await expense(lower.token, lowerFood, 8500, 'Groceries', today);
    const lowerNotes = await request('/api/insights', { token: lower.token });
    assert.equal(
      lowerNotes.body.data.insights.find((item) => item.type === 'spending_decrease').message,
      'Your Food spending is 15% lower than last month.',
    );

    const smallChange = await createUser('insights-api-small@example.com');
    const smallFood = await categoryId(smallChange.id, 'Food');
    await expense(smallChange.token, smallFood, 10000, 'Old groceries', previous);
    await expense(smallChange.token, smallFood, 11400, 'Groceries', today);
    const smallNotes = await request('/api/insights', { token: smallChange.token });
    assert.equal(smallNotes.body.data.insights.some((item) => item.type === 'spending_increase'), false);

    const unusualUser = await createUser('insights-api-unusual@example.com');
    const unusualFood = await categoryId(unusualUser.id, 'Food');
    await expense(unusualUser.token, unusualFood, 1000, 'Snack', today);
    await expense(unusualUser.token, unusualFood, 1000, 'Coffee', today);
    await expense(unusualUser.token, unusualFood, 10000, 'Banquet', today);
    const unusualNotes = await request('/api/insights', { token: unusualUser.token });
    assert.equal(
      unusualNotes.body.data.insights.find((item) => item.type === 'unusual_expense').message,
      'Banquet is 10,000 MMK, higher than your other expenses this month.',
    );

    const overspent = await createUser('insights-api-over@example.com');
    await expense(overspent.token, await categoryId(overspent.id, 'Food'), 5000, 'Dinner', today);
    await request('/api/income', {
      method: 'POST',
      token: overspent.token,
      body: { amount: 1000, source: 'Gift', incomeDate: today },
    });
    const overNotes = await request('/api/insights', { token: overspent.token });
    assert.equal(
      overNotes.body.data.insights.find((item) => item.type === 'expenses_higher').message,
      'Your expenses are currently higher than your income this month.',
    );

    const empty = await createUser('insights-api-empty@example.com');
    const emptyNotes = await request('/api/insights', { token: empty.token });
    assert.deepEqual(emptyNotes.body.data.insights, []);
  });
});

function money(amount) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} MMK`;
}

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
