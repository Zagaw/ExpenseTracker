import mongoose from 'mongoose';
import { protectOwnership } from './ownershipPlugin.js';
import { amountField, schemaOptions, userRef } from './fields.js';

const incomeSchema = new mongoose.Schema(
  {
    userId: userRef(),
    amount: amountField(),
    source: {
      type: String,
      required: [true, 'Source is required'],
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    incomeDate: {
      type: Date,
      required: [true, 'Date is required'],
    },
  },
  { ...schemaOptions, collection: 'income' },
);

incomeSchema.index({ userId: 1, incomeDate: -1, createdAt: -1 });
incomeSchema.index({ userId: 1, amount: -1, createdAt: -1 });
protectOwnership(incomeSchema);

export const Income = mongoose.model('Income', incomeSchema);
