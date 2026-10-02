import { getDashboard } from '../services/summaryService.js';
import { sendData } from '../utils/response.js';

export async function dashboardSummary(req, res) {
  const dashboard = await getDashboard(req.user.userId);
  sendData(res, dashboard);
}
