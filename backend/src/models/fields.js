import mongoose from 'mongoose';
import { FREQUENCIES, NOTIFICATION_TYPES, PAYMENT_METHODS } from '../constants/domain.js';

const { Schema } = mongoose;

export function userRef({ required = true } = {}) {
  return {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required,
    immutable: true,
    default: required ? undefined : null,
  };
}

export function categoryRef() {
  return {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  };
}

export function amountField() {
  return {
    type: Number,
    required: [true, 'Amount must be greater than 0'],
    min: [1, 'Amount must be greater than 0'],
    validate: {
      validator: Number.isInteger,
      message: 'Amount must be greater than 0',
    },
  };
}

export function paymentMethodField() {
  return {
    type: String,
    enum: PAYMENT_METHODS,
    default: 'cash',
  };
}

export function frequencyField() {
  return {
    type: String,
    enum: {
      values: FREQUENCIES,
      message: 'Frequency must be weekly, monthly, or yearly',
    },
    required: [true, 'Frequency is required'],
  };
}

export function notificationTypeField() {
  return {
    type: String,
    enum: {
      values: NOTIFICATION_TYPES,
      message: 'Notification type is not supported',
    },
    required: [true, 'Notification type is required'],
  };
}

export const schemaOptions = {
  timestamps: true,
  versionKey: false,
};
