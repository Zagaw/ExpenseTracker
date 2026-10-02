import { Menu } from 'lucide-react';
import { translatePhrase } from '../../i18n';
import LanguageToggle from '../common/LanguageToggle';
import NotificationIndicator from './NotificationIndicator';
import UserMenu from './UserMenu';

export default function Topbar({ unreadCount = 0, onOpenMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={translatePhrase('Open menu')}
          aria-controls="mobile-navigation"
          className="inline-flex size-9 items-center justify-center rounded-md text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <p className="hidden text-sm font-semibold text-primary sm:inline lg:hidden">{translatePhrase('Expense Tracker')}</p>
      </div>
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <NotificationIndicator unreadCount={unreadCount} />
        <UserMenu />
      </div>
    </header>
  );
}
