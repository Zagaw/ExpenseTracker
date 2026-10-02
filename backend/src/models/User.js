import mongoose from 'mongoose';
import { schemaOptions } from './fields.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is not valid'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  schemaOptions,
);

function hidePasswordHash(_doc, ret) {
  delete ret.passwordHash;
  return ret;
}

userSchema.set('toJSON', { transform: hidePasswordHash });
userSchema.set('toObject', { transform: hidePasswordHash });

export const User = mongoose.model('User', userSchema);
