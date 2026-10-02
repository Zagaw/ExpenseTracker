import { LoaderCircle } from 'lucide-react';
import { translatePhrase } from '../../i18n';

export default function LoadingScreen({ label = 'Loading' }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-ink">
      <p className="flex items-center gap-2 text-sm text-muted" role="status">
        <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
        {translatePhrase(label)}
      </p>
    </main>
  );
}
