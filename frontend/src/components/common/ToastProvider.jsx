import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from '../../context/toast-context';
import { translatePhrase, useLanguage } from '../../i18n';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  useLanguage();

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, tone = 'success') => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role="status"
            className={`rounded-md border border-border bg-surface px-4 py-3 text-sm shadow-sm ${toast.tone === 'error' ? 'text-danger' : 'text-success'}`}
          >
            {translatePhrase(toast.message)}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
