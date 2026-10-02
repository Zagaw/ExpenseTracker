import { Router } from 'express';
import { listInsights } from '../controllers/insightController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', listInsights);

export default router;
