import path from 'node:path';
import { pathToFileURL } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { notFoundMiddleware } from './middleware/notFoundMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import recurringExpenseRoutes from './routes/recurringExpenseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

export const app = express();

if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recurring-expenses', recurringExpenseRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

function redactSecrets(message) {
  if (!message) {
    return 'Unknown startup error.';
  }

  return message.split(env.mongoUri).join('[redacted]').split(env.jwtSecret).join('[redacted]');
}

export async function start() {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

const entryPath = process.argv[1];
const isMain = entryPath && import.meta.url === pathToFileURL(path.resolve(entryPath)).href;

if (isMain) {
  start().catch((error) => {
    console.error('Failed to start server.');
    console.error(redactSecrets(error.message));
    process.exit(1);
  });
}
