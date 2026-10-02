import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchUnreadCount, NOTIFICATIONS_CHANGED } from '../../services/notificationApi';

export function useUnreadCount() {
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [count, setCount] = useState(0);
  const [requestId, setRequestId] = useState(0);

  const reload = useCallback(() => {
    setRequestId((value) => value + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    fetchUnreadCount()
      .then((value) => {
        if (!ignore) {
          setCount(Number.isInteger(value) ? value : 0);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [location.pathname, requestId]);

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_CHANGED, reload);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, reload);
  }, [reload]);

  return { status, count, reload };
}
