import api from './api';

export const NOTIFICATIONS_CHANGED = 'expense-tracker:notifications-changed';

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export async function fetchUnreadCount() {
  const response = await api.get('/notifications/unread-count');
  return response.data.data.unreadCount;
}

export async function listNotifications() {
  const response = await api.get('/notifications');
  return response.data.data.notifications;
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.data.notification;
}

export async function markAllNotificationsRead() {
  const response = await api.patch('/notifications/read-all');
  return response.data.data;
}

export async function deleteNotification(id) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data.data;
}
