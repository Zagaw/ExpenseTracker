import { translatePhrase } from '../../i18n';
import LanguageToggle from '../common/LanguageToggle';
import PageIcon from '../common/PageIcon';

export default function AuthCard({ title, description, icon, children, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-ink">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-8">
        <div className="flex items-start justify-between gap-3">
          {icon ? <PageIcon icon={icon} /> : <span />}
          <LanguageToggle />
        </div>
        <p className="mt-4 text-sm font-medium text-primary">{translatePhrase('Expense Tracker')}</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight">{translatePhrase(title)}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{translatePhrase(description)}</p>
        <div className="mt-6">{children}</div>
        <div className="mt-6 text-sm text-muted">{footer}</div>
      </section>
    </main>
  );
}
