import { translatePhrase } from '../../i18n';
import { LogOut, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { accountNav, planningNav, primaryNav, transactionNav } from './navItems';

const linkClass = ({ isActive }) =>
  [
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    isActive ? 'bg-primary-light font-medium text-primary' : 'text-ink hover:bg-background',
  ].join(' ');

export default function Sidebar({ unreadCount = 0, onNavigate, onClose, closeButtonRef }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    onNavigate?.();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-14 shrink-0 items-center justify-between px-4">
        <p className="text-sm font-semibold text-primary">{translatePhrase('Expense Tracker')}</p>
        {onClose ? (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={translatePhrase('Close menu')}
            className="inline-flex size-9 items-center justify-center rounded-md text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={translatePhrase('Main')}>
        <NavGroup items={primaryNav} unreadCount={unreadCount} onNavigate={onNavigate} />
        <p className="px-3 pb-1 pt-4 text-sm font-medium text-muted">{translatePhrase('Transactions')}</p>
        <NavGroup items={transactionNav} unreadCount={unreadCount} onNavigate={onNavigate} />
        <div className="pt-2">
          <NavGroup items={planningNav} unreadCount={unreadCount} onNavigate={onNavigate} />
        </div>
      </nav>
      <div className="shrink-0 border-t border-border px-3 py-3">
        <NavGroup items={accountNav} unreadCount={unreadCount} onNavigate={onNavigate} />
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {translatePhrase('Log out')}
        </button>
      </div>
    </div>
  );
}

function NavGroup({ items, unreadCount, onNavigate }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} className={linkClass} onClick={onNavigate}>
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{translatePhrase(item.label)}</span>
            {item.to === '/notifications' && unreadCount > 0 ? (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
