import { useCallback, useEffect, useState } from 'react';
import { Bell, CircleAlert } from 'lucide-react';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import NotificationList, { NotificationListSkeleton } from '../components/notifications/NotificationList';
import { useToast } from '../hooks/useToast';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notifyNotificationsChanged,
} from '../services/notificationApi';

export default function Notifications() {
  const { notify } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState('loading');
  const [requestId, setRequestId] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const unread = notifications.filter((item) => !item.isRead).length;

  const reload = useCallback(() => {
    setStatus('loading');
    setRequestId((value) => value + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    listNotifications()
      .then((items) => {
        if (!ignore) {
          setNotifications(items);
          setStatus('ready');
          notifyNotificationsChanged();
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  async function handleRead(notification) {
    try {
      const updated = await markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      notifyNotificationsChanged();
      notify('Notification marked as read.');
    } catch {
      notify('Unable to update the notification. Please try again.', 'error');
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);

    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      notifyNotificationsChanged();
      notify('All notifications marked as read.');
    } catch {
      notify('Unable to update the notifications. Please try again.', 'error');
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteNotification(pendingDelete.id);
      setNotifications((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      notifyNotificationsChanged();
      notify('Notification deleted.');
    } catch {
      notify('Unable to delete the notification. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SectionPage
      icon={Bell}
      title="Notifications"
      description="Budget warnings, recurring reminders, and monthly reports."
      action={unread > 0 ? (
        <Button type="button" variant="secondary" fullWidth={false} loading={markingAll} onClick={handleMarkAll}>
          Mark all as read
        </Button>
      ) : null}
    >
      {status === 'loading' ? <NotificationListSkeleton /> : null}
      {status === 'error' ? (
        <EmptyState icon={CircleAlert} title="Unable to load your notifications" description="Check your connection and try again.">
          <Button type="button" fullWidth={false} onClick={reload}>Try again</Button>
        </EmptyState>
      ) : null}
      {status === 'ready' && notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Budget warnings and reminders will appear here." />
      ) : null}
      {status === 'ready' && notifications.length > 0 ? (
        <NotificationList notifications={notifications} onRead={handleRead} onDelete={setPendingDelete} />
      ) : null}
      {pendingDelete ? (
        <ConfirmDialog
          title="Delete this notification?"
          description="This only removes the notice. Your budgets and expenses stay."
          loading={deleting}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </SectionPage>
  );
}
