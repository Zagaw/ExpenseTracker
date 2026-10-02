import { translatePhrase } from '../../i18n';
import { Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { mobileNav } from './navItems';

export default function MobileNav({ menuOpen, onOpenMenu }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface lg:hidden"
      aria-label={translatePhrase('Primary')}
    >
      <ul className="grid grid-cols-5">
        {mobileNav.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                  isActive ? 'font-medium text-primary' : 'text-muted',
                ].join(' ')
              }
            >
              <item.icon className="size-5" aria-hidden="true" />
              {translatePhrase(item.label)}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onOpenMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className={[
              'flex h-16 w-full flex-col items-center justify-center gap-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
              menuOpen ? 'font-medium text-primary' : 'text-muted',
            ].join(' ')}
          >
            <Menu className="size-5" aria-hidden="true" />
            {translatePhrase('Menu')}
          </button>
        </li>
      </ul>
    </nav>
  );
}
