import mongoose from 'mongoose';
import { AppError } from './AppError.js';

export function requireUserId(userId) {
  if (userId === undefined || userId === null || !mongoose.isValidObjectId(userId)) {
    throw new AppError('Authenticated user is required.', 401);
  }

  return new mongoose.Types.ObjectId(String(userId));
}

export function parseDocumentId(id) {
  if (id === undefined || id === null || !mongoose.isValidObjectId(id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(String(id));
}
