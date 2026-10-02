import { Router } from 'express';
import {
  budgetProgress,
  createBudget,
  deleteBudget,
  getBudget,
  listBudgets,
  updateBudget,
} from '../controllers/budgetController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/progress', budgetProgress);
router.get('/', listBudgets);
router.get('/:id', getBudget);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
