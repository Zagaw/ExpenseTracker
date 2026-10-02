import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAuthToken({ userId, email }) {
  return jwt.sign(
    {
      userId: String(userId),
      email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn, algorithm: 'HS256' },
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}
