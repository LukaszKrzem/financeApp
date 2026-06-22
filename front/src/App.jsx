import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import './App.css';

import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Accounts = lazy(() => import('./pages/Accounts'));
const SavingsGoals = lazy(() => import('./pages/SavingsGoals'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Settings = lazy(() => import('./pages/Settings'));

const API_URL = import.meta.env.VITE_API_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleGoogleLogin = async (googleToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken.credential }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'login error');
      }
      handleLogin(data.token);
    } catch (error) {
      console.error('Error google auth', error);
    }
  };

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/budgets/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setBudgets(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching budgets data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrencies = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/currencies`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCurrencies(data);
        }
      } catch (error) {
        console.error('Error fetching currencies:', error);
      }
    };

    const fetchCategories = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/categories/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    const fetchTransactions = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/transactions/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
        } else {
          console.error('Failed to fetch transactions');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAccounts = async () => {
      try {
        const response = await fetch(`${API_URL}/accounts/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData); //if token is invalid
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    fetchAccounts();
    fetchCurrencies();
    fetchCategories();
    fetchBudgets();
    fetchTransactions();
  }, [token, refreshing]);
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Ładowanie aplikacji...
      </div>
    );
  }
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                token ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Home apiUrl={API_URL} onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/login"
              element={
                token ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login
                    onLogin={handleLogin}
                    apiUrl={API_URL}
                    handleGoogleLogin={handleGoogleLogin}
                    GOOGLE_CLIENT_ID={GOOGLE_CLIENT_ID}
                  />
                )
              }
            />
            <Route
              path="/register"
              element={
                token ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Register
                    apiUrl={API_URL}
                    onRegistration={handleLogin}
                    handleGoogleLogin={handleGoogleLogin}
                    GOOGLE_CLIENT_ID={GOOGLE_CLIENT_ID}
                  />
                )
              }
            />
            <Route
              element={
                <Layout
                  onLogout={handleLogout}
                  user={user}
                  token={token}
                  accounts={accounts}
                  categories={categories}
                  currencies={currencies}
                  setRefreshing={setRefreshing}
                  apiUrl={API_URL}
                />
              }
            >
              <Route
                path="/"
                element={
                  token ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Home apiUrl={API_URL} onLogin={handleLogin} />
                  )
                }
              />

              <Route
                path="/dashboard"
                element={
                  token ? (
                    <Dashboard
                      onLogout={handleLogout}
                      user={user}
                      token={token}
                      accounts={accounts}
                      refreshing={refreshing}
                      setRefreshing={setRefreshing}
                      budgets={budgets}
                      categories={categories}
                      transactions={transactions}
                      loading={loading}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/budgets"
                element={
                  token ? (
                    <Budgets
                      token={token}
                      categories={categories}
                      budgets={budgets}
                      setRefreshing={setRefreshing}
                      loading={loading}
                      apiUrl={API_URL}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/accounts"
                element={
                  token ? (
                    <Accounts
                      token={token}
                      accounts={accounts}
                      loading={loading}
                      setRefreshing={setRefreshing}
                      currencies={currencies}
                      apiUrl={API_URL}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/savings-goals"
                element={
                  token ? (
                    <SavingsGoals
                      onLogout={handleLogout}
                      user={user}
                      token={token}
                      apiUrl={API_URL}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/transactions"
                element={
                  token ? (
                    <Transactions
                      transactions={transactions}
                      loading={loading}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/settings"
                element={
                  token ? (
                    <Settings
                      onLogout={handleLogout}
                      user={user}
                      token={token}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
