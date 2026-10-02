import { Router } from 'express';
import {
  createExpense,
  deleteExpense,
  exportExpenses,
  getExpense,
  listExpenses,
  updateExpense,
} from '../controllers/expenseController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listExpenses);
router.get('/export', exportExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
