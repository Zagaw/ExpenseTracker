import mongoose, { Schema } from 'mongoose';
import { protectOwnership } from './ownershipPlugin.js';
import { amountField, categoryRef, paymentMethodField, schemaOptions, userRef } from './fields.js';

const expenseSchema = new mongoose.Schema(
  {
    userId: userRef(),
    categoryId: categoryRef(),
    amount: amountField(),
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    expenseDate: {
      type: Date,
      required: [true, 'Date is required'],
    },
    paymentMethod: paymentMethodField(),
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    recurringExpenseId: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringExpense',
    },
    occurrenceDate: {
      type: Date,
    },
  },
  schemaOptions,
);

expenseSchema.index({ userId: 1, expenseDate: -1, createdAt: -1 });
expenseSchema.index({ userId: 1, categoryId: 1, expenseDate: -1, createdAt: -1 });
expenseSchema.index({ userId: 1, amount: -1, createdAt: -1 });
expenseSchema.index(
  { recurringExpenseId: 1, occurrenceDate: 1 },
  { unique: true, partialFilterExpression: { recurringExpenseId: { $type: 'objectId' } } },
);
protectOwnership(expenseSchema);

export const Expense = mongoose.model('Expense', expenseSchema);
