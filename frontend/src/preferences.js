const THEME_KEY = 'expense-tracker.theme';
const DATE_FORMAT_KEY = 'expense-tracker.dateFormat';

export const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const DATE_FORMATS = [
  { value: 'medium', label: '2 Oct 2026' },
  { value: 'iso', label: '2026-10-02' },
  { value: 'dmy', label: '02/10/2026' },
  { value: 'mdy', label: '10/02/2026' },
];

const themeListeners = new Set();
const dateListeners = new Set();

let theme = readTheme();
let dateFormat = readDateFormat();
applyTheme(theme);

export function getTheme() {
  return theme;
}

export function getDateFormat() {
  return dateFormat;
}

export function setTheme(value) {
  const next = value === 'dark' ? 'dark' : 'light';

  if (next === theme) {
    return;
  }

  theme = next;
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  themeListeners.forEach((listener) => listener());
}

export function setDateFormat(value) {
  const next = DATE_FORMATS.some((item) => item.value === value) ? value : 'medium';

  if (next === dateFormat) {
    return;
  }

  dateFormat = next;
  localStorage.setItem(DATE_FORMAT_KEY, next);
  dateListeners.forEach((listener) => listener());
}

export function subscribeTheme(listener) {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

export function subscribeDateFormat(listener) {
  dateListeners.add(listener);
  return () => dateListeners.delete(listener);
}

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function readDateFormat() {
  try {
    const stored = localStorage.getItem(DATE_FORMAT_KEY);
    return DATE_FORMATS.some((item) => item.value === stored) ? stored : 'medium';
  } catch {
    return 'medium';
  }
}

function applyTheme(value) {
  document.documentElement.dataset.theme = value;
}
