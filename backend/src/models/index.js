import { Budget } from './Budget.js';
import { Category } from './Category.js';
import { Expense } from './Expense.js';
import { Income } from './Income.js';
import { Notification } from './Notification.js';
import { Profile } from './Profile.js';
import { RecurringExpense } from './RecurringExpense.js';
import { User } from './User.js';

export async function syncModelIndexes() {
  await Promise.all([
    User.syncIndexes(),
    Profile.syncIndexes(),
    Category.syncIndexes(),
    Expense.syncIndexes(),
    Income.syncIndexes(),
    Budget.syncIndexes(),
    RecurringExpense.syncIndexes(),
    Notification.syncIndexes(),
  ]);
}

export {
  Budget,
  Category,
  Expense,
  Income,
  Notification,
  Profile,
  RecurringExpense,
  User,
};
