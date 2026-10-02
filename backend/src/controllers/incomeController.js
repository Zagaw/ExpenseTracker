import { incomeService } from '../services/incomeService.js';
import { sendData } from '../utils/response.js';

export async function listIncome(req, res) {
  const result = await incomeService.list(req.user.userId, req.query);
  sendData(res, result);
}

export async function getIncome(req, res) {
  const income = await incomeService.present(req.user.userId, req.params.id);
  sendData(res, { income });
}

export async function createIncome(req, res) {
  const created = await incomeService.create(req.user.userId, req.body);
  const income = await incomeService.present(req.user.userId, created._id);
  sendData(res, { income }, 201);
}

export async function updateIncome(req, res) {
  const updated = await incomeService.update(req.user.userId, req.params.id, req.body);
  const income = await incomeService.present(req.user.userId, updated._id);
  sendData(res, { income });
}

export async function deleteIncome(req, res) {
  const deleted = await incomeService.remove(req.user.userId, req.params.id);
  sendData(res, { id: String(deleted._id) });
}
