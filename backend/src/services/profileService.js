import { CURRENCIES } from '../constants/domain.js';
import { Profile } from '../models/Profile.js';
import { AppError } from '../utils/AppError.js';
import { requireUserId } from '../utils/ownership.js';
import { normalizeDatabaseError, pickOwnedInput } from '../utils/validation.js';

const profileFields = {
  fullName: {
    type: 'string',
    required: true,
    max: 80,
    label: 'Name',
    requiredMessage: 'Name is required',
  },
  avatarUrl: {
    type: 'string',
    max: 500,
    nullable: true,
    label: 'Avatar URL',
  },
  currency: { type: 'currency', values: CURRENCIES },
  notifyBudgets: { type: 'boolean' },
  notifyRecurring: { type: 'boolean' },
  notifyReports: { type: 'boolean' },
};

export function presentProfile(profile) {
  return {
    fullName: profile.fullName,
    currency: profile.currency || 'MMK',
    notifyBudgets: profile.notifyBudgets !== false,
    notifyRecurring: profile.notifyRecurring !== false,
    notifyReports: profile.notifyReports !== false,
  };
}

export const profileService = {
  async create(userId, input) {
    const ownerId = requireUserId(userId);
    const data = pickOwnedInput(input, profileFields, 'create');

    try {
      const profile = await Profile.create({ ...data, userId: ownerId });
      return profile.toObject();
    } catch (error) {
      throw normalizeDatabaseError(error, 'Profile already exists.');
    }
  },

  async get(userId) {
    const ownerId = requireUserId(userId);
    const profile = await Profile.findOne({ userId: ownerId }).lean();

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile;
  },

  async update(userId, input) {
    const ownerId = requireUserId(userId);
    const data = pickOwnedInput(input, profileFields, 'update');

    if (Object.keys(data).length === 0) {
      throw new AppError('Validation failed', 400, {
        body: 'No valid fields to update',
      });
    }

    try {
      const profile = await Profile.findOneAndUpdate({ userId: ownerId }, data, {
        returnDocument: 'after',
        runValidators: true,
      }).lean();

      if (!profile) {
        throw new AppError('Profile not found', 404);
      }

      return profile;
    } catch (error) {
      throw normalizeDatabaseError(error, 'Profile already exists.');
    }
  },
};
