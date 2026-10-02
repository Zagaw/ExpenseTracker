import { useEffect, useState, useSyncExternalStore } from 'react';
import { Outlet } from 'react-router-dom';
import { translatePhrase } from '../../i18n';
import { getDateFormat, getTheme, subscribeDateFormat, subscribeTheme } from '../../preferences';
import MobileDrawer from './MobileDrawer';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUnreadCount } from './useUnreadCount';

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useUnreadCount();
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getTheme);
  const dateFormat = useSyncExternalStore(subscribeDateFormat, getDateFormat, getDateFormat);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');

    function closeOnDesktop() {
      if (media.matches) {
        setMenuOpen(false);
      }
    }

    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <div className="min-h-screen bg-background text-ink lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]" data-theme={theme} data-date-format={dateFormat}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary"
      >
        {translatePhrase('Skip to main content')}
      </a>
      <aside className="sticky top-0 hidden h-screen border-r border-border lg:block">
        <Sidebar unreadCount={count} />
      </aside>
      {menuOpen ? <MobileDrawer unreadCount={count} onClose={() => setMenuOpen(false)} /> : null}
      <div className="flex min-h-screen min-w-0 flex-col">
        <Topbar unreadCount={count} onOpenMenu={() => setMenuOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
        <MobileNav menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
      </div>
    </div>
  );
}
