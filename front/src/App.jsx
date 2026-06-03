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
import { set } from "zod";

const API_URL = "http://localhost:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const handleLogin = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };
  useEffect(() => {
    // const fetchTransactions = async () => {
    //   if (!token) return;

    //   try {
    //     const response = await fetch("http://localhost:8000/transactions", {
    //       headers: {
    //         Authorization: `Bearer ${token}`,
    //       },
    //     });

    //     if (response.ok) {
    //       const data = await response.json();
    //       setTransactions(data);
    //       console.log("Transactions:", data);
    //     } else {
    //       console.error("Failed to fetch transactions");
    //     }
    //   } catch (error) {
    //     console.error("Error fetching transactions:", error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
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

          // if (data.length > 0) {
          //   setAccountId(data[0].id_account.toString());
          // }
          console.log("Accounts:", data);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    };

    if (token) {
      fetchAccounts();
    }
  }, [token, refreshing]);
  useEffect(() => {
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
  }, [token]);
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;
