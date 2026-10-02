import mongoose from 'mongoose';
import { protectOwnership } from './ownershipPlugin.js';
import { notificationTypeField, userRef } from './fields.js';

const notificationSchema = new mongoose.Schema(
  {
    userId: userRef(),
    type: notificationTypeField(),
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    dedupeKey: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: 'notifications',
    versionKey: false,
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } },
);
protectOwnership(notificationSchema);

export const Notification = mongoose.model('Notification', notificationSchema);
