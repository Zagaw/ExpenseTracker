import bcrypt from 'bcryptjs';
import { Category } from '../models/Category.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signAuthToken } from '../utils/jwt.js';
import { requireUserId } from '../utils/ownership.js';
import { categoryService } from './categoryService.js';
import { presentProfile, profileService } from './profileService.js';

const PASSWORD_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let dummyPasswordHash;

async function getDummyPasswordHash() {
  if (!dummyPasswordHash) {
    dummyPasswordHash = await bcrypt.hash('invalid-password', PASSWORD_ROUNDS);
  }

  return dummyPasswordHash;
}

export const authService = {
  async register(input) {
    const { fullName, email, password } = validateRegister(input);
    const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS);
    let user;

    try {
      user = await User.create({ email, passwordHash });
      const profile = await profileService.create(user._id, { fullName });
      await categoryService.ensureDefaultCategories(user._id);
      return toSession(user, profile);
    } catch (error) {
      if (user) {
        await Category.deleteMany({ userId: user._id });
        await Profile.deleteMany({ userId: user._id });
        await User.deleteOne({ _id: user._id });
      }

      if (error?.code === 11000 || error?.statusCode === 409) {
        throw new AppError('An account with this email already exists.', 409);
      }

      throw error;
    }
  },

  async login(input) {
    const { email, password } = validateLogin(input);
    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordHash = user?.passwordHash || (await getDummyPasswordHash());
    const candidate = password.length > 72 ? 'invalid-password-length' : password;
    const matches = await bcrypt.compare(candidate, passwordHash);

    if (!user || password.length > 72 || !matches) {
      throw new AppError('Email or password is incorrect.', 401);
    }

    const profile = await profileService.get(user._id);
    return toSession(user, profile);
  },

  async getCurrentUser(userId) {
    const ownerId = requireUserId(userId);
    const user = await User.findById(ownerId).lean();

    if (!user) {
      throw new AppError('Account not found.', 401);
    }

    const profile = await profileService.get(ownerId);

    return toPublicUser(user, profile);
  },
};

function toSession(user, profile) {
  return {
    token: signAuthToken({ userId: user._id, email: user.email }),
    user: toPublicUser(user, profile),
  };
}

function toPublicUser(user, profile) {
  return {
    id: String(user._id),
    email: user.email,
    ...presentProfile(profile),
  };
}

function validateRegister(input) {
  const source = requireBody(input);
  const fullName = readText(source.fullName);
  const email = readText(source.email).toLowerCase();
  const password = typeof source.password === 'string' ? source.password : '';
  const errors = {};

  if (!fullName) {
    errors.fullName = 'Name is required';
  } else if (fullName.length > 80) {
    errors.fullName = 'Name must be 80 characters or fewer';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Email is not valid';
  }

  assignPasswordErrors(password, errors);

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return { fullName, email, password };
}

function validateLogin(input) {
  const source = requireBody(input);
  const email = readText(source.email).toLowerCase();
  const password = typeof source.password === 'string' ? source.password : '';
  const errors = {};

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Email is not valid';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }

  return { email, password };
}

function assignPasswordErrors(password, errors) {
  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (password.length > 72) {
    errors.password = 'Password must be 72 characters or fewer';
  }
}

function requireBody(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError('Validation failed', 400, {
      body: 'Request body must be an object',
    });
  }

  return input;
}

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}
