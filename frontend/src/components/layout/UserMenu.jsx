import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { translatePhrase } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary-light text-xs font-medium text-primary">
          {initials(user.fullName)}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{user.fullName}</span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={translatePhrase('Account')}
          className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-border bg-surface py-1 shadow-sm"
        >
          <MenuLink to="/profile" onSelect={() => setOpen(false)}>
            {translatePhrase('Profile')}
          </MenuLink>
          <MenuLink to="/settings" onSelect={() => setOpen(false)}>
            {translatePhrase('Settings')}
          </MenuLink>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            {translatePhrase('Log out')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ to, onSelect, children }) {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onSelect}
      className="block px-3 py-2 text-sm text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </Link>
  );
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'U';
  }

  return parts.map((part) => part[0].toUpperCase()).join('');
}
