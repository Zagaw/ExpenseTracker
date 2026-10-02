import { Children } from 'react';
import { LoaderCircle } from 'lucide-react';
import { translatePhrase } from '../../i18n';

const VARIANTS = {
  primary: 'bg-primary text-white',
  secondary: 'border border-border bg-surface text-ink',
  danger: 'bg-danger text-white',
};

export default function Button({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}) {
  return (
    <button
      {...props}
      aria-label={typeof props['aria-label'] === 'string' ? translatePhrase(props['aria-label']) : props['aria-label']}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${fullWidth ? 'w-full' : ''} ${VARIANTS[variant]} ${className}`.trim()}
      disabled={loading || disabled}
      aria-busy={loading}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {Children.map(children, (child) => (typeof child === 'string' ? translatePhrase(child) : child))}
    </button>
  );
}
