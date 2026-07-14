import { useCallback } from 'react';
import { apiFetch } from '@/lib/apiFetch';
import { useAuth } from '@/context/AuthContext';

export function useApi() {
  const { token, apiUrl, onLogout } = useAuth();

  const call = useCallback(
    (path, options = {}) => {
      const url = path.startsWith('http') ? path : `${apiUrl}${path}`;
      return apiFetch(url, token, options, onLogout);
    },
    [token, apiUrl, onLogout]
  );

  const get = useCallback((path) => call(path), [call]);

  const post = useCallback(
    (path, body) => call(path, { method: 'POST', body: JSON.stringify(body) }),
    [call]
  );

  const patch = useCallback(
    (path, body) => call(path, { method: 'PATCH', body: JSON.stringify(body) }),
    [call]
  );

  const del = useCallback((path) => call(path, { method: 'DELETE' }), [call]);

  return { call, get, post, patch, del };
}
