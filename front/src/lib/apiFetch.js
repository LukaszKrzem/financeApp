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
    localStorage.removeItem('token');
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired');
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error('Invalid JSON response from server', { cause: e });
  }

  if (!response.ok) {
    const message = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(', ')
      : data?.detail || 'Something went wrong';
    throw new Error(message);
  }

  return data;
}
