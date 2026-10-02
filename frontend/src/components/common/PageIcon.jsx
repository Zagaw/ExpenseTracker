import { createElement } from 'react';

export default function PageIcon({ icon, className = '' }) {
  return (
    <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary ${className}`}>
      {createElement(icon, { className: 'size-5', 'aria-hidden': true })}
    </span>
  );
}
