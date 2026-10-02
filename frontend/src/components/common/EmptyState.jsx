import { translatePhrase } from '../../i18n';
import PageIcon from './PageIcon';

export default function EmptyState({ title, description, icon, children }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
      {icon ? (
        <div className="flex justify-center">
          <PageIcon icon={icon} />
        </div>
      ) : null}
      <h2 className={`text-base font-medium text-ink ${icon ? 'mt-3' : ''}`}>{translatePhrase(title)}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{translatePhrase(description)}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
