import { Router } from 'express';
import { dashboardSummary } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/summary', dashboardSummary);

export default router;
