import mongoose from 'mongoose';
import { protectOwnership } from './ownershipPlugin.js';
import { schemaOptions, userRef } from './fields.js';

const profileSchema = new mongoose.Schema(
  {
    userId: userRef(),
    fullName: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    avatarUrl: {
      type: String,
      default: null,
      maxlength: 500,
    },
    currency: {
      type: String,
      default: 'MMK',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
    notifyBudgets: {
      type: Boolean,
      default: true,
    },
    notifyRecurring: {
      type: Boolean,
      default: true,
    },
    notifyReports: {
      type: Boolean,
      default: true,
    },
  },
  { ...schemaOptions, collection: 'profiles' },
);

profileSchema.index({ userId: 1 }, { unique: true });
protectOwnership(profileSchema);

export const Profile = mongoose.model('Profile', profileSchema);
