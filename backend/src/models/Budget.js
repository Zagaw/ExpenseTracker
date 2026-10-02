import mongoose from 'mongoose';
import { protectOwnership } from './ownershipPlugin.js';
import { amountField, categoryRef, schemaOptions, userRef } from './fields.js';

const budgetSchema = new mongoose.Schema(
  {
    userId: userRef(),
    categoryId: categoryRef(),
    amount: amountField(),
    month: {
      type: Number,
      required: [true, 'Month must be between 1 and 12'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
      validate: {
        validator: Number.isInteger,
        message: 'Month must be between 1 and 12',
      },
    },
    year: {
      type: Number,
      required: [true, 'Year is not valid'],
      min: [2000, 'Year is not valid'],
      max: [2100, 'Year is not valid'],
      validate: {
        validator: Number.isInteger,
        message: 'Year is not valid',
      },
    },
  },
  schemaOptions,
);

budgetSchema.index({ userId: 1, year: 1, month: 1 });
budgetSchema.index({ userId: 1, categoryId: 1, year: 1, month: 1 }, { unique: true });
protectOwnership(budgetSchema);

export const Budget = mongoose.model('Budget', budgetSchema);
