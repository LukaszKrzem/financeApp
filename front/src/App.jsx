import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./App.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Budgets from "./pages/Budgets";
import Accounts from "./pages/Accounts";
import SavingsGoals from "./pages/SavingsGoals";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";

const API_URL = "http://localhost:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8000/categories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          console.log("Categories:", data);
        } else {
          console.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    const fetchTransactions = async () => {
      if (!token) return;

      try {
        const response = await fetch("http://localhost:8000/transactions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTransactions(data);
          console.log("Transactions:", data);
        } else {
          console.error("Failed to fetch transactions");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAccounts = async () => {
      try {
        const response = await fetch("http://localhost:8000/accounts", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
          console.log("Accounts:", data);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
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
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData); //if token is invalid
          console.log(userData);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    fetchAccounts();
    fetchCategories();
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
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/dashboard" replace /> : <Home />}
          />
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} apiUrl={API_URL} />
              )
            }
          />
          <Route
            path="/register"
            element={
              token ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register apiUrl={API_URL} onRegistration={handleLogin} />
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
                setRefreshing={setRefreshing}
              />
            }
          >
            <Route
              path="/"
              element={token ? <Navigate to="/dashboard" replace /> : <Home />}
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
                  <Budgets onLogout={handleLogout} user={user} token={token} />
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
                    onLogout={handleLogout}
                    user={user}
                    token={token}
                    accounts={accounts}
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
                    onLogout={handleLogout}
                    user={user}
                    token={token}
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
                  <Settings onLogout={handleLogout} user={user} token={token} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
