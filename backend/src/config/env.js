import dotenv from 'dotenv';

dotenv.config({ override: false });

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function requiredSecret(name) {
  const value = required(name);

  if (value.length < 32) {
    throw new Error(`${name} must be at least 32 characters.`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGODB_URI'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: requiredSecret('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
