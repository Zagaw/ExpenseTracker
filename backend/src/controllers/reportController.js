import { reportService } from '../services/reportService.js';
import { sendData } from '../utils/response.js';

export async function monthlyReport(req, res) {
  sendData(res, await reportService.monthly(req.user.userId, req.query));
}

export async function categoryReport(req, res) {
  sendData(res, await reportService.categories(req.user.userId, req.query));
}

export async function trendReport(req, res) {
  sendData(res, await reportService.trends(req.user.userId, req.query));
}
