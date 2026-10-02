import { Router } from 'express';
import {
  createRecurringExpense,
  deleteRecurringExpense,
  listRecurringExpenses,
  toggleRecurringExpense,
  updateRecurringExpense,
} from '../controllers/recurringExpenseController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listRecurringExpenses);
router.post('/', createRecurringExpense);
router.patch('/:id/toggle', toggleRecurringExpense);
router.put('/:id', updateRecurringExpense);
router.delete('/:id', deleteRecurringExpense);

export default router;
