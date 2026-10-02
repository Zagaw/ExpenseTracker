import { useCallback, useEffect, useState } from 'react';
import { listExpenses } from '../services/expenseApi';

export function useExpenses(filters) {
  const filtersKey = JSON.stringify(filters);
  const [requestId, setRequestId] = useState(0);
  const [seenKey, setSeenKey] = useState(filtersKey);
  const [state, setState] = useState({
    status: 'loading',
    expenses: [],
    page: filters.page || 1,
    limit: 20,
    total: 0,
  });

  if (seenKey !== filtersKey) {
    setSeenKey(filtersKey);
    setState((current) => ({ ...current, status: 'loading' }));
  }

  const reload = useCallback(() => {
    setState((current) => ({ ...current, status: 'loading' }));
    setRequestId((value) => value + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    listExpenses(JSON.parse(filtersKey))
      .then((data) => {
        if (!ignore) {
          setState({
            status: 'ready',
            expenses: data.expenses,
            page: data.page,
            limit: data.limit,
            total: data.total,
          });
        }
      })
      .catch(() => {
        if (!ignore) {
          setState((current) => ({ ...current, status: 'error' }));
        }
      });

    return () => {
      ignore = true;
    };
  }, [filtersKey, requestId]);

  return { ...state, reload };
}
