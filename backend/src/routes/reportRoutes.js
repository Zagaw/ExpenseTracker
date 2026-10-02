import { Router } from 'express';
import { categoryReport, monthlyReport, trendReport } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/monthly', monthlyReport);
router.get('/categories', categoryReport);
router.get('/trends', trendReport);

export default router;
