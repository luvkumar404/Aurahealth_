import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.defaults.baseURL = API_BASE;
    axios.defaults.withCredentials = true;
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch current user:", err?.response?.data || err.message);
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post("/auth/login", { email, password });
    const returnedToken = res.data.token;
    if (returnedToken) {
      localStorage.setItem("token", returnedToken);
      setToken(returnedToken);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload) => {
    const res = await axios.post("/auth/register", payload);
    const returnedToken = res.data.token;
    if (returnedToken) {
      localStorage.setItem("token", returnedToken);
      setToken(returnedToken);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(
          "/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
    } catch (err) {
      console.error("Logout error:", err?.response?.data || err.message);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

