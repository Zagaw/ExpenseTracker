import mongoose from 'mongoose';
import { syncModelIndexes } from '../models/index.js';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri, { autoIndex: false });
  await mongoose.connection.db.command({ ping: 1 });
  await syncModelIndexes();

  console.log(`MongoDB connected to database "${mongoose.connection.name}"`);
}
