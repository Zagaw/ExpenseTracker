import { notificationService } from '../services/notificationService.js';
import { sendData } from '../utils/response.js';

export async function unreadCount(req, res) {
  const count = await notificationService.countUnread(req.user.userId);
  sendData(res, { unreadCount: count });
}

export async function listNotifications(req, res) {
  const notifications = await notificationService.listForUser(req.user.userId);
  sendData(res, { notifications });
}

export async function markNotificationRead(req, res) {
  const notification = await notificationService.markRead(req.user.userId, req.params.id);
  sendData(res, { notification });
}

export async function markAllNotificationsRead(req, res) {
  const result = await notificationService.markAllRead(req.user.userId);
  sendData(res, result);
}

export async function deleteNotification(req, res) {
  const result = await notificationService.removeForUser(req.user.userId, req.params.id);
  sendData(res, result);
}
