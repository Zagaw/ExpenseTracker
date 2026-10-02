import { categoryService } from '../services/categoryService.js';
import { sendData } from '../utils/response.js';

export async function listCategories(req, res) {
  const result = await categoryService.listWithSpending(req.user.userId);
  sendData(res, result);
}

export async function createCategory(req, res) {
  const created = await categoryService.create(req.user.userId, req.body);
  const category = await categoryService.present(req.user.userId, created._id);
  sendData(res, { category }, 201);
}

export async function updateCategory(req, res) {
  const updated = await categoryService.update(req.user.userId, req.params.id, req.body);
  const category = await categoryService.present(req.user.userId, updated._id);
  sendData(res, { category });
}

export async function deleteCategory(req, res) {
  const deleted = await categoryService.remove(req.user.userId, req.params.id);
  sendData(res, { id: String(deleted._id) });
}
