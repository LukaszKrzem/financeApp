import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/apiFetch';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const onLogin = useCallback((newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  const onLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const handleGoogleLogin = async (googleToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken.credential }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'login error');
      }
      onLogin(data.token);
    } catch (error) {
      console.error('Error google auth:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await apiFetch(`${API_URL}/me`, token, {}, onLogout);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        onLogout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token, onLogout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        apiUrl: API_URL,
        googleClientId: GOOGLE_CLIENT_ID,
        onLogin,
        onLogout,
        handleGoogleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
