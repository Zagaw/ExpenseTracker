import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import Button from '../components/common/Button';
import LanguageToggle from '../components/common/LanguageToggle';
import SectionPage from '../components/common/SectionPage';
import SelectField from '../components/common/SelectField';
import TextField from '../components/common/TextField';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { dateFormatHint, translatePhrase } from '../i18n';
import { DATE_FORMATS, THEMES, getDateFormat, getTheme, setDateFormat, setTheme } from '../preferences';
import { updateProfile } from '../services/profileApi';
import { getApiError } from '../utils/apiError';
import { formatDateValue } from '../utils/dates';

const CURRENCIES = [
  ['MMK', 'MMK — Myanmar kyat'],
  ['USD', 'USD — US dollar'],
  ['EUR', 'EUR — Euro'],
  ['GBP', 'GBP — British pound'],
  ['SGD', 'SGD — Singapore dollar'],
  ['THB', 'THB — Thai baht'],
  ['JPY', 'JPY — Japanese yen'],
  ['CNY', 'CNY — Chinese yuan'],
  ['INR', 'INR — Indian rupee'],
  ['AUD', 'AUD — Australian dollar'],
];

const PREVIEW_DATE = '2026-10-02T00:00:00.000Z';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { notify } = useToast();
  const [fullName, setFullName] = useState(user.fullName);
  const [currency, setCurrency] = useState(user.currency || 'MMK');
  const [notifyBudgets, setNotifyBudgets] = useState(user.notifyBudgets !== false);
  const [notifyRecurring, setNotifyRecurring] = useState(user.notifyRecurring !== false);
  const [notifyReports, setNotifyReports] = useState(user.notifyReports !== false);
  const [theme, setThemeState] = useState(getTheme);
  const [dateFormat, setDateFormatState] = useState(getDateFormat);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Name is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('');
      return;
    }

    setSaving(true);
    setErrors({});
    setFormError('');

    try {
      const profile = await updateProfile({
        fullName: fullName.trim(),
        currency,
        notifyBudgets,
        notifyRecurring,
        notifyReports,
      });
      updateUser(profile);
      notify('Settings saved.');
    } catch (error) {
      const apiError = getApiError(error);
      setErrors(apiError.errors);
      setFormError(Object.keys(apiError.errors).length > 0 ? '' : 'Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function changeTheme(value) {
    setTheme(value);
    setThemeState(value);
  }

  function changeDateFormat(value) {
    setDateFormat(value);
    setDateFormatState(value);
  }

  return (
    <SectionPage
      icon={SettingsIcon}
      title="Settings"
      description="Account details are saved with your profile. Language, theme, and date format stay on this device."
    >
      <form onSubmit={handleSubmit} className="max-w-xl space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-ink">{translatePhrase('Profile')}</h2>
          <TextField
            id="settings-name"
            label="Name"
            value={fullName}
            error={errors.fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <TextField id="settings-email" label="Email" value={user.email} hint="Email stays with your login." readOnly />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-ink">{translatePhrase('Currency')}</h2>
          <SelectField
            id="settings-currency"
            label="Currency"
            value={currency}
            error={errors.currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {CURRENCIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectField>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-ink">{translatePhrase('Appearance')}</h2>
          <div>
            <p className="text-sm font-medium text-ink">{translatePhrase('Language')}</p>
            <div className="mt-1.5">
              <LanguageToggle />
            </div>
            <p className="mt-1 text-sm text-muted">{translatePhrase('Saved on this device.')}</p>
          </div>
          <SelectField
            id="settings-theme"
            label="Theme"
            hint="Saved on this device."
            value={theme}
            onChange={(event) => changeTheme(event.target.value)}
          >
            {THEMES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </SelectField>
          <SelectField
            id="settings-date-format"
            label="Date format"
            hint={dateFormatHint(formatDateValue(PREVIEW_DATE, dateFormat))}
            value={dateFormat}
            onChange={(event) => changeDateFormat(event.target.value)}
          >
            {DATE_FORMATS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </SelectField>
        </section>

        <fieldset className="space-y-3">
          <legend className="text-lg font-medium text-ink">{translatePhrase('Notifications')}</legend>
          <Preference
            id="settings-notify-budgets"
            label="Budget alerts"
            description="Warnings when a budget is close to its limit or over it."
            checked={notifyBudgets}
            onChange={setNotifyBudgets}
          />
          <Preference
            id="settings-notify-recurring"
            label="Recurring reminders"
            description="Reminders a few days before a recurring expense is due."
            checked={notifyRecurring}
            onChange={setNotifyRecurring}
          />
          <Preference
            id="settings-notify-reports"
            label="Monthly reports"
            description="A summary when this month has income or expenses."
            checked={notifyReports}
            onChange={setNotifyReports}
          />
        </fieldset>

        {formError ? <p className="text-sm text-danger">{translatePhrase(formError)}</p> : null}
        <Button type="submit" fullWidth={false} loading={saving}>Save settings</Button>
      </form>
    </SectionPage>
  );
}

function Preference({ id, label, description, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
      <input
        id={id}
        type="checkbox"
        className="mt-1 size-4 accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-ink">{translatePhrase(label)}</span>
        <span className="mt-1 block text-sm leading-6 text-muted">{translatePhrase(description)}</span>
      </span>
    </label>
  );
}
