import { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { get } = useApi();
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
    const fetchData = async () => {
      setData((prev) => ({ ...prev, loading: true }));
      try {
        const [accounts, transactions, budgets, categories, currencies] =
          await Promise.all([
            get('/accounts/'),
            get('/transactions/'),
            get('/budgets/'),
            get('/categories/'),
            get('/currencies/'),
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
  }, [get, refreshing]);

  return (
    <DataContext.Provider value={{ ...data, setRefreshing }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
