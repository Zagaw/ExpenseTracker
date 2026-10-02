import { translatePhrase } from '../../i18n';

export default function TextField({ id, label, hint, error, multiline = false, ...props }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  const fieldClass = 'mt-1.5 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {translatePhrase(label)}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${fieldClass} py-2`}
          {...props}
          placeholder={typeof props.placeholder === 'string' ? translatePhrase(props.placeholder) : props.placeholder}
        />
      ) : (
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${fieldClass} h-10`}
          {...props}
          placeholder={typeof props.placeholder === 'string' ? translatePhrase(props.placeholder) : props.placeholder}
        />
      )}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {translatePhrase(hint)}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {translatePhrase(error)}
        </p>
      ) : null}
    </div>
  );
}
