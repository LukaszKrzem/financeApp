import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '@/lib/apiFetch';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { token, apiUrl, onLogout } = useAuth();
  const [data, setData] = useState({
    accounts: [],
    transactions: [],
    budgets: [],
    categories: [],
    currencies: [],
    loading: true,
  });
  const [refreshing, setRefreshing] = useState(0);

  useEffect(() => {
    if (!token) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    const fetchData = async () => {
      setData((prev) => ({ ...prev, loading: true }));
      try {
        const [accounts, transactions, budgets, categories, currencies] =
          await Promise.all([
            apiFetch(`${apiUrl}/accounts/`, token, {}, onLogout),
            apiFetch(`${apiUrl}/transactions/`, token, {}, onLogout),
            apiFetch(`${apiUrl}/budgets/`, token, {}, onLogout),
            apiFetch(`${apiUrl}/categories/`, token, {}, onLogout),
            apiFetch(`${apiUrl}/currencies/`, token, {}, onLogout),
          ]);
        setData({
          accounts,
          transactions,
          budgets,
          categories,
          currencies,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setData((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, [token, apiUrl, onLogout, refreshing]);

  return (
    <DataContext.Provider value={{ ...data, setRefreshing }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
