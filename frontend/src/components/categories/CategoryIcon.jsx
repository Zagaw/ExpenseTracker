import { createElement } from 'react';
import { translatePhrase } from '../../i18n';
import { categoryIcon } from './categoryIcons';

export default function CategoryIcon({ name, color, label }) {
  return (
    <span
      className="inline-flex size-10 items-center justify-center rounded-md"
      style={{ backgroundColor: `${color}22`, color }}
      aria-hidden={label ? undefined : true}
      aria-label={label ? translatePhrase(label) : undefined}
    >
      {createElement(categoryIcon(name), { className: 'size-5', 'aria-hidden': true })}
    </span>
  );
}
