import { Children, cloneElement, isValidElement } from 'react';
import { translatePhrase } from '../../i18n';

export default function SelectField({ id, label, hint, error, children, ...props }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {translatePhrase(label)}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        {...props}
      >
        {Children.map(children, translateOption)}
      </select>
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

function translateOption(child) {
  if (!isValidElement(child)) {
    return typeof child === 'string' ? translatePhrase(child) : child;
  }

  const text = optionText(child.props.children);

  if (text == null) {
    return child;
  }

  return cloneElement(child, null, translatePhrase(text));
}

function optionText(content) {
  if (typeof content === 'string' || typeof content === 'number') {
    return String(content);
  }

  if (Array.isArray(content)) {
    return content.map((part) => optionText(part) || '').join('');
  }

  return null;
}
