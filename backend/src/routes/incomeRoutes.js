import { Router } from 'express';
import {
  createIncome,
  deleteIncome,
  getIncome,
  listIncome,
  updateIncome,
} from '../controllers/incomeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listIncome);
router.get('/:id', getIncome);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

export default router;
