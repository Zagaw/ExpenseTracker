import { translatePhrase } from '../../i18n';
import PageIcon from '../common/PageIcon';
import { insightIcon } from './insightIcons';

export default function InsightCard({ insight }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <PageIcon icon={insightIcon(insight.type)} />
        <div className="min-w-0">
          <h2 className="text-base font-medium text-ink">{translatePhrase(insight.title)}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{translatePhrase(insight.message)}</p>
        </div>
      </div>
    </article>
  );
}
