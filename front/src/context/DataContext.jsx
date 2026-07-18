import { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { get } = useApi();
  const { token } = useAuth();
  const [data, setData] = useState({
    accounts: [],
    transactions: [],
    budgets: [],
    categories: [],
    currencies: [],
    savingsGoals: [],
    loading: true,
  });
  const [refreshing, setRefreshing] = useState(0);

  useEffect(() => {
    if (!token) {
      setData((prev) => ({
        ...prev,
        accounts: [],
        transactions: [],
        budgets: [],
        savingsGoals: [],
        loading: false,
      }));
      return;
    }
    const fetchData = async () => {
      setData((prev) => ({ ...prev, loading: true }));
      try {
        const [
          accounts,
          transactions,
          budgets,
          categories,
          currencies,
          savingsGoals,
        ] = await Promise.all([
          get('/accounts/'),
          get('/transactions/'),
          get('/budgets/'),
          get('/categories/'),
          get('/currencies/'),
          get('/savings-goals/'),
        ]);
        setData({
          accounts,
          transactions,
          budgets,
          categories,
          currencies,
          savingsGoals,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setData((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, [get, token, refreshing]);

  const refreshData = () => setRefreshing((prev) => prev + 1);

  return (
    <DataContext.Provider value={{ ...data, refreshData }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
