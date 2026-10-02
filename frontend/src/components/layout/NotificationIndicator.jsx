import { translatePhrase } from '../../i18n';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotificationIndicator({ unreadCount = 0 }) {
  const label = unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications';
  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <Link
      to="/notifications"
      aria-label={translatePhrase(label)}
      className="relative inline-flex size-9 items-center justify-center rounded-md text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Bell className="size-5" aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute right-0.5 top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium leading-4 text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
