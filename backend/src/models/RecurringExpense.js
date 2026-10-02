import mongoose from 'mongoose';
import { protectOwnership } from './ownershipPlugin.js';
import {
  amountField,
  categoryRef,
  frequencyField,
  paymentMethodField,
  schemaOptions,
  userRef,
} from './fields.js';

const recurringExpenseSchema = new mongoose.Schema(
  {
    userId: userRef(),
    categoryId: categoryRef(),
    amount: amountField(),
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 200,
    },
    frequency: frequencyField(),
    nextDate: {
      type: Date,
      required: [true, 'Date is required'],
    },
    paymentMethod: paymentMethodField(),
    active: {
      type: Boolean,
      default: true,
    },
    lastProcessedAt: {
      type: Date,
      default: null,
    },
  },
  { ...schemaOptions, collection: 'recurring_expenses' },
);

recurringExpenseSchema.index({ userId: 1, active: 1, nextDate: 1 });
protectOwnership(recurringExpenseSchema);

export const RecurringExpense = mongoose.model('RecurringExpense', recurringExpenseSchema);
