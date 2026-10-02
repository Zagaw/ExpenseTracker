import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Button from '../common/Button';
import PageIcon from '../common/PageIcon';
import { notificationIcon } from './notificationIcons';
import { translatePhrase } from '../../i18n';
import { formatExpenseDate } from '../../utils/dates';

const LINKS = {
  budget_warning: { to: '/budgets', label: 'View budgets' },
  budget_exceeded: { to: '/budgets', label: 'View budgets' },
  monthly_report: { to: '/reports', label: 'View report' },
  recurring_reminder: { to: '/recurring-expenses', label: 'View recurring' },
};

export default function NotificationList({ notifications, onRead, onDelete }) {
  return (
    <ul className="space-y-3">
      {notifications.map((notification) => {
        const link = LINKS[notification.type];

        return (
          <li key={notification.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <PageIcon icon={notificationIcon(notification.type)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-medium text-ink">{translatePhrase(notification.title)}</h2>
                  {notification.isRead ? null : (
                    <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">{translatePhrase('Unread')}</span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">{translatePhrase(notification.message)}</p>
                <p className="mt-1 text-sm text-muted">{formatExpenseDate(notification.createdAt)}</p>
                {link ? (
                  <Link to={link.to} className="mt-2 inline-flex text-sm font-medium text-primary">
                    {translatePhrase(link.label)}
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {notification.isRead ? null : (
                <Button type="button" variant="secondary" fullWidth={false} onClick={() => onRead(notification)}>
                  Mark as read
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                fullWidth={false}
                aria-label={`Delete ${notification.title}`}
                onClick={() => onDelete(notification)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}
