import { recurringExpenseService } from '../services/recurringExpenseService.js';
import { sendData } from '../utils/response.js';

export async function listRecurringExpenses(req, res) {
  const recurringExpenses = await recurringExpenseService.listForUser(req.user.userId);
  sendData(res, { recurringExpenses });
}

export async function createRecurringExpense(req, res) {
  const created = await recurringExpenseService.create(req.user.userId, req.body);
  await recurringExpenseService.processDue(req.user.userId);
  const recurringExpense = await recurringExpenseService.presentOne(req.user.userId, created._id);
  sendData(res, { recurringExpense }, 201);
}

export async function updateRecurringExpense(req, res) {
  const updated = await recurringExpenseService.update(req.user.userId, req.params.id, req.body);
  await recurringExpenseService.processDue(req.user.userId);
  const recurringExpense = await recurringExpenseService.presentOne(req.user.userId, updated._id);
  sendData(res, { recurringExpense });
}

export async function toggleRecurringExpense(req, res) {
  const recurringExpense = await recurringExpenseService.toggle(req.user.userId, req.params.id);
  sendData(res, { recurringExpense });
}

export async function deleteRecurringExpense(req, res) {
  const deleted = await recurringExpenseService.remove(req.user.userId, req.params.id);
  sendData(res, { id: String(deleted._id) });
}
