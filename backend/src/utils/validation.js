import mongoose from 'mongoose';
import { parseDateOnly } from './dateUtils.js';
import { AppError } from './AppError.js';

const RENAMES = {
  category_id: 'categoryId',
  expense_date: 'expenseDate',
  payment_method: 'paymentMethod',
  income_date: 'incomeDate',
  full_name: 'fullName',
  avatar_url: 'avatarUrl',
  is_read: 'isRead',
  next_date: 'nextDate',
  user_id: 'userId',
};

const BLOCKED_FIELDS = new Set([
  'userId',
  'user_id',
  'passwordHash',
  '_id',
  'id',
  'createdAt',
  'updatedAt',
  'lastProcessedAt',
]);

export function pickOwnedInput(input, fields, mode) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('Validation failed', 400, {
      body: 'Request body must be an object',
    });
  }

  const source = {};

  for (const [key, value] of Object.entries(input)) {
    if (key.startsWith('$') || BLOCKED_FIELDS.has(key)) {
      continue;
    }

    const name = RENAMES[key] || key;

    if (BLOCKED_FIELDS.has(name) || !Object.prototype.hasOwnProperty.call(fields, name)) {
      continue;
    }

    source[name] = value;
  }

  const errors = {};
  const data = {};

  for (const [name, spec] of Object.entries(fields)) {
    const present = Object.prototype.hasOwnProperty.call(source, name);

    if (!present) {
      if (mode === 'create' && spec.required) {
        errors[name] = spec.requiredMessage || `${spec.label || name} is required`;
      }
      continue;
    }

    if ((source[name] === '' || source[name] === null) && spec.required && !spec.nullable) {
      errors[name] = spec.requiredMessage || `${spec.label || name} is required`;
      continue;
    }

    const parsed = parseField(name, source[name], spec, errors);

    if (parsed !== undefined) {
      data[name] = parsed;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return data;
}

function parseField(name, value, spec, errors) {
  if ((value === null || value === '') && spec.nullable) {
    return null;
  }

  switch (spec.type) {
    case 'amount':
      return parseAmount(name, value, errors);
    case 'string':
      return parseString(name, value, spec, errors);
    case 'date':
      return parseDate(name, value, spec, errors);
    case 'enum':
      return parseEnum(name, value, spec, errors);
    case 'objectId':
      return parseObjectId(name, value, errors);
    case 'integer':
      return parseInteger(name, value, spec, errors);
    case 'boolean':
      return parseBoolean(name, value, errors);
    case 'icon':
      return parseIcon(name, value, spec, errors);
    case 'color':
      return parseColor(name, value, errors);
    case 'currency':
      return parseCurrency(name, value, spec, errors);
    default:
      errors[name] = 'Invalid field';
      return undefined;
  }
}

function parseAmount(name, value, errors) {
  let amount = value;

  if (typeof amount === 'string' && /^-?\d+$/.test(amount.trim())) {
    amount = Number(amount.trim());
  }

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) {
    errors[name] = 'Amount must be greater than 0';
    return undefined;
  }

  return amount;
}

function parseString(name, value, spec, errors) {
  if (typeof value !== 'string') {
    errors[name] = `${spec.label || 'This field'} must be text`;
    return undefined;
  }

  const trimmed = value.trim();

  if (spec.required && trimmed.length === 0) {
    errors[name] = spec.requiredMessage || `${spec.label || name} is required`;
    return undefined;
  }

  if (trimmed.length > spec.max) {
    errors[name] = `${spec.label || 'This field'} must be ${spec.max} characters or fewer`;
    return undefined;
  }

  return trimmed;
}

function parseDate(name, value, spec, errors) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = parseDateOnly(value);

    if (!date) {
      errors[name] = 'A valid date is required';
      return undefined;
    }

    return date;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (!(value instanceof Date) && typeof value !== 'string') {
    errors[name] = spec.requiredMessage || 'A valid date is required';
    return undefined;
  }

  if (Number.isNaN(date.getTime())) {
    errors[name] = spec.requiredMessage || 'A valid date is required';
    return undefined;
  }

  return date;
}

function parseEnum(name, value, spec, errors) {
  if (typeof value !== 'string') {
    errors[name] = spec.message || 'Invalid value';
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (!spec.values.includes(normalized)) {
    errors[name] = spec.message || 'Invalid value';
    return undefined;
  }

  return normalized;
}

function parseObjectId(name, value, errors) {
  if (!mongoose.isValidObjectId(value)) {
    errors[name] = 'Invalid id';
    return undefined;
  }

  return new mongoose.Types.ObjectId(String(value));
}

function parseInteger(name, value, spec, errors) {
  let number = value;

  if (typeof number === 'string' && /^-?\d+$/.test(number.trim())) {
    number = Number(number.trim());
  }

  if (typeof number !== 'number' || !Number.isInteger(number) || number < spec.min || number > spec.max) {
    errors[name] = spec.message;
    return undefined;
  }

  return number;
}

function parseBoolean(name, value, errors) {
  if (typeof value !== 'boolean') {
    errors[name] = 'Invalid value';
    return undefined;
  }

  return value;
}

function parseIcon(name, value, spec, errors) {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value.trim())) {
    errors[name] = 'Icon is not valid';
    return undefined;
  }

  const icon = value.trim().toLowerCase();

  if (spec.values && !spec.values.includes(icon)) {
    errors[name] = 'Icon is not valid';
    return undefined;
  }

  return icon;
}

function parseColor(name, value, errors) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value.trim())) {
    errors[name] = 'Color must be a hex value';
    return undefined;
  }

  return value.trim().toUpperCase();
}

function parseCurrency(name, value, spec, errors) {
  if (typeof value !== 'string' || !/^[A-Za-z]{3}$/.test(value.trim())) {
    errors[name] = 'Currency must be a 3-letter code';
    return undefined;
  }

  const currency = value.trim().toUpperCase();

  if (spec.values && !spec.values.includes(currency)) {
    errors[name] = 'Currency is not supported';
    return undefined;
  }

  return currency;
}

export function normalizeDatabaseError(error, duplicateMessage) {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.name === 'ValidationError') {
    const errors = {};

    for (const [field, detail] of Object.entries(error.errors)) {
      errors[field] = detail.message;
    }

    return new AppError('Validation failed', 400, errors);
  }

  if (error?.code === 11000) {
    return new AppError(duplicateMessage || 'A record with these values already exists.', 409);
  }

  if (error?.name === 'CastError') {
    return new AppError('Validation failed', 400, {
      [error.path || 'value']: 'Invalid value',
    });
  }

  return error;
}
