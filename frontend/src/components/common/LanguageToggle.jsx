import { translatePhrase, useLanguage, setLanguage } from '../../i18n';

export default function LanguageToggle() {
  const language = useLanguage();

  return (
    <div
      className="inline-flex rounded-md border border-border p-0.5"
      role="group"
      aria-label={translatePhrase('Language')}
    >
      <LanguageButton active={language === 'en'} onClick={() => setLanguage('en')}>
        EN
      </LanguageButton>
      <LanguageButton active={language === 'my'} onClick={() => setLanguage('my')}>
        မြန်မာ
      </LanguageButton>
    </div>
  );
}

function LanguageButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded px-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active ? 'bg-primary-light text-primary' : 'text-muted'}`}
    >
      {children}
    </button>
  );
}
