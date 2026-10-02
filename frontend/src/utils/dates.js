import { translatePhrase } from '../i18n';
import { getDateFormat } from '../preferences';

export function toDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function toExpenseInputDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function formatExpenseDate(value) {
  const iso = toExpenseInputDate(value);

  if (iso === toDateInputValue()) {
    return translatePhrase('Today');
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (iso === toDateInputValue(yesterday)) {
    return translatePhrase('Yesterday');
  }

  return formatDateValue(value, getDateFormat());
}

export function formatDateValue(value, format = getDateFormat()) {
  const date = new Date(value);

  if (format === 'iso') {
    return date.toISOString().slice(0, 10);
  }

  if (format === 'dmy') {
    return date.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (format === 'mdy') {
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return translatePhrase(date.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }));
}
