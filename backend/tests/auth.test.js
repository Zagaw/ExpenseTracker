import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';
import { Category } from '../src/models/Category.js';
import { User } from '../src/models/User.js';
import { app } from '../src/server.js';
import { DEFAULT_CATEGORIES } from '../src/constants/domain.js';
import { syncModelIndexes } from '../src/models/index.js';

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

describe('authentication', () => {
  it('registers a user, profile, and default categories without returning the password', async () => {
    const suppliedId = new mongoose.Types.ObjectId().toString();
    const response = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Aung Aung',
        email: 'Aung@Example.com',
        password: 'correct-password',
        userId: suppliedId,
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.user.email, 'aung@example.com');
    assert.equal(response.body.data.user.fullName, 'Aung Aung');
    assert.equal(response.body.data.user.currency, 'MMK');
    assert.notEqual(response.body.data.user.id, suppliedId);
    assert.equal(typeof response.body.data.token, 'string');
    const payload = JSON.stringify(response.body);
    assert.equal(payload.includes('correct-password'), false);
    assert.equal(payload.includes('passwordHash'), false);

    const stored = await User.findOne({ email: 'aung@example.com' }).select('+passwordHash').lean();
    assert.ok(stored.passwordHash);
    assert.notEqual(stored.passwordHash, 'correct-password');

    const categories = await Category.find({ userId: stored._id }).lean();
    assert.equal(categories.length, DEFAULT_CATEGORIES.length);

    const me = await request('/api/auth/me?userId=' + suppliedId, {
      token: response.body.data.token,
    });
    assert.equal(me.status, 200);
    assert.equal(me.body.data.user.email, 'aung@example.com');
  });

  it('rejects duplicate emails, bad passwords, and unauthenticated or forged tokens', async () => {
    const duplicate = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Other Person',
        email: 'aung@example.com',
        password: 'another-password',
      },
    });
    assert.equal(duplicate.status, 409);

    const invalid = await request('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: '',
        email: 'not-an-email',
        password: 'short',
      },
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.errors.password, 'Password must be at least 8 characters');

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'aung@example.com',
        password: 'correct-password',
      },
    });
    assert.equal(login.status, 200);

    const wrongPassword = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'aung@example.com',
        password: 'wrong-password',
      },
    });
    assert.equal(wrongPassword.status, 401);
    assert.equal(wrongPassword.body.message, 'Email or password is incorrect.');

    const missingUser = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'missing@example.com',
        password: 'correct-password',
      },
    });
    assert.equal(missingUser.status, 401);
    assert.equal(missingUser.body.message, 'Email or password is incorrect.');

    const missingToken = await request('/api/auth/me');
    assert.equal(missingToken.status, 401);

    const invalidToken = await request('/api/auth/me', { token: 'not-a-token' });
    assert.equal(invalidToken.status, 401);
    assert.equal(invalidToken.body.message, 'Invalid token.');

    const expiredToken = jwt.sign(
      { userId: login.body.data.user.id, email: login.body.data.user.email },
      env.jwtSecret,
      { expiresIn: -10 },
    );
    const expired = await request('/api/auth/me', { token: expiredToken });
    assert.equal(expired.status, 401);
    assert.equal(expired.body.message, 'Your session has expired. Please log in again.');

    const otherAlgorithm = jwt.sign(
      { userId: login.body.data.user.id, email: login.body.data.user.email },
      env.jwtSecret,
      { algorithm: 'HS512' },
    );
    const rejectedAlgorithm = await request('/api/auth/me', { token: otherAlgorithm });
    assert.equal(rejectedAlgorithm.status, 401);
    assert.equal(rejectedAlgorithm.body.message, 'Invalid token.');

    const unsigned = unsignedToken({
      userId: login.body.data.user.id,
      email: login.body.data.user.email,
    });
    const rejectedUnsigned = await request('/api/auth/me', { token: unsigned });
    assert.equal(rejectedUnsigned.status, 401);

    const oversized = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'aung@example.com',
        password: 'a'.repeat(5000),
      },
    });
    assert.equal(oversized.status, 401);
    assert.equal(oversized.body.message, 'Email or password is incorrect.');
    assert.equal(JSON.stringify(oversized.body).includes('passwordHash'), false);
  });
});

function unsignedToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.`;
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
