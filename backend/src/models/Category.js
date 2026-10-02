import mongoose from 'mongoose';
import { protectOwnership } from './ownershipPlugin.js';
import { schemaOptions, userRef } from './fields.js';

const categorySchema = new mongoose.Schema(
  {
    userId: userRef({ required: false }),
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 40,
    },
    icon: {
      type: String,
      required: [true, 'Icon is required'],
      trim: true,
      maxlength: 40,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value'],
    },
  },
  schemaOptions,
);

categorySchema.index(
  { userId: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
categorySchema.index({ userId: 1, createdAt: -1 });
protectOwnership(categorySchema);

export const Category = mongoose.model('Category', categorySchema);
