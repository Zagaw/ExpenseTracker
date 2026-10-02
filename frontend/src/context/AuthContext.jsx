import { useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginAccount, registerAccount } from '../services/authApi';
import { clearStoredToken, getStoredToken, storeToken } from '../services/tokenStorage';
import { syncActiveCurrency } from '../utils/currency';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const hasStoredToken = Boolean(getStoredToken());
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(hasStoredToken ? 'loading' : 'ready');

  useEffect(() => {
    if (!hasStoredToken) {
      return undefined;
    }

    let ignore = false;

    fetchCurrentUser()
      .then((currentUser) => {
        if (!ignore) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (!ignore) {
          clearStoredToken();
          setUser(null);
        }
      })
      .finally(() => {
        if (!ignore) {
          setStatus('ready');
        }
      });

    return () => {
      ignore = true;
    };
  }, [hasStoredToken]);

  const value = useMemo(
    () => ({
      user,
      status,
      async register(payload) {
        const session = await registerAccount(payload);
        storeToken(session.token);
        setUser(session.user);
        return session.user;
      },
      async login(payload) {
        const session = await loginAccount(payload);
        storeToken(session.token);
        setUser(session.user);
        return session.user;
      },
      logout() {
        clearStoredToken();
        setUser(null);
      },
      updateUser(patch) {
        setUser((current) => (current ? { ...current, ...patch } : current));
      },
    }),
    [status, user],
  );

  syncActiveCurrency(user?.currency);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
