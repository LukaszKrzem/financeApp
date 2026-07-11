export async function apiFetch(url, token, options = {}, onUnauthorized) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    console.warn('Session expired. Logging out...');
    localStorage.removeItem('token');
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    const message = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(', ')
      : data?.detail || 'Something went wrong';
    throw new Error(message);
  }

  return data;
}
