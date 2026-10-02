import { translatePhrase } from '../../i18n';
import PageIcon from './PageIcon';

export default function SectionPage({ title, description, action, icon, children }) {
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? <PageIcon icon={icon} className="mt-1" /> : null}
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight">{translatePhrase(title)}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{translatePhrase(description)}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
