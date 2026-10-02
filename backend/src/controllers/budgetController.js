import { budgetService } from '../services/budgetService.js';
import { sendData } from '../utils/response.js';

export async function listBudgets(req, res) {
  const result = await budgetService.listWithProgress(req.user.userId, req.query);
  sendData(res, result);
}

export async function budgetProgress(req, res) {
  const progress = await budgetService.progress(req.user.userId, req.query);
  sendData(res, { progress });
}

export async function getBudget(req, res) {
  const budget = await budgetService.present(req.user.userId, req.params.id);
  sendData(res, { budget });
}

export async function createBudget(req, res) {
  const created = await budgetService.create(req.user.userId, req.body);
  const budget = await budgetService.present(req.user.userId, created._id);
  sendData(res, { budget }, 201);
}

export async function updateBudget(req, res) {
  const updated = await budgetService.update(req.user.userId, req.params.id, req.body);
  const budget = await budgetService.present(req.user.userId, updated._id);
  sendData(res, { budget });
}

export async function deleteBudget(req, res) {
  const deleted = await budgetService.remove(req.user.userId, req.params.id);
  sendData(res, { id: String(deleted._id) });
}
