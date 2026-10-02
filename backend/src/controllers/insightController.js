import { insightService } from '../services/insightService.js';
import { sendData } from '../utils/response.js';

export async function listInsights(req, res) {
  const insights = await insightService.list(req.user.userId);
  sendData(res, { insights });
}
