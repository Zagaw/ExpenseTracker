import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Notification } from '../src/models/Notification.js';
import { User } from '../src/models/User.js';
import { syncModelIndexes } from '../src/models/index.js';
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

describe('notification unread count', () => {
  it('counts only the signed-in user unread notifications', async () => {
    const userA = await User.create({ email: 'count-a@example.com', passwordHash: 'hash' });
    const userB = await User.create({ email: 'count-b@example.com', passwordHash: 'hash' });
    const tokenA = signToken(userA);
    const tokenB = signToken(userB);

    await Notification.create({
      userId: userA._id,
      type: 'budget_warning',
      title: 'Budget warning',
      message: 'You have used 82% of your monthly budget.',
      isRead: false,
    });
    await Notification.create({
      userId: userA._id,
      type: 'monthly_report',
      title: 'Monthly report',
      message: 'Your monthly report is ready.',
      isRead: true,
    });
    await Notification.create({
      userId: userB._id,
      type: 'budget_exceeded',
      title: 'Budget exceeded',
      message: 'You are over budget.',
      isRead: false,
    });

    const ownCount = await request('/api/notifications/unread-count', { token: tokenA });
    assert.equal(ownCount.status, 200);
    assert.equal(ownCount.body.data.unreadCount, 1);

    const otherCount = await request(`/api/notifications/unread-count?userId=${userB._id}`, {
      token: tokenA,
    });
    assert.equal(otherCount.status, 200);
    assert.equal(otherCount.body.data.unreadCount, 1);

    const userBCount = await request('/api/notifications/unread-count', { token: tokenB });
    assert.equal(userBCount.body.data.unreadCount, 1);

    const missingToken = await request('/api/notifications/unread-count');
    assert.equal(missingToken.status, 401);
  });
});

function signToken(user) {
  return jwt.sign(
    { userId: String(user._id), email: user.email },
    env.jwtSecret,
    { expiresIn: '1h' },
  );
}

async function request(pathname, { token } = {}) {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}${pathname}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}
