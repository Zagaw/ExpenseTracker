import { expenseService } from '../services/expenseService.js';
import { sendData } from '../utils/response.js';

export async function listExpenses(req, res) {
  const result = await expenseService.list(req.user.userId, req.query);
  sendData(res, result);
}

export async function exportExpenses(req, res) {
  const { csv, filename } = await expenseService.exportCsv(req.user.userId, req.query);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}

export async function getExpense(req, res) {
  const expense = await expenseService.present(req.user.userId, req.params.id);
  sendData(res, { expense });
}

export async function createExpense(req, res) {
  const created = await expenseService.create(req.user.userId, req.body);
  const expense = await expenseService.present(req.user.userId, created._id);
  sendData(res, { expense }, 201);
}

export async function updateExpense(req, res) {
  const updated = await expenseService.update(req.user.userId, req.params.id, req.body);
  const expense = await expenseService.present(req.user.userId, updated._id);
  sendData(res, { expense });
}

export async function deleteExpense(req, res) {
  const deleted = await expenseService.remove(req.user.userId, req.params.id);
  sendData(res, { id: String(deleted._id) });
}
