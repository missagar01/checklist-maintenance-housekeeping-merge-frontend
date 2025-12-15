"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../Api/loginApi";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  name: "user-name",
  role: "role",
  email: "email_id",
  userId: "user_id",
  department: "department",
  token: "token",
};

const readFromStorage = () => {
  const name = localStorage.getItem(STORAGE_KEYS.name);
  if (!name) return null;

  return {
    name,
    role: localStorage.getItem(STORAGE_KEYS.role) || "",
    email: localStorage.getItem(STORAGE_KEYS.email) || "",
    userId: localStorage.getItem(STORAGE_KEYS.userId) || "",
    department: localStorage.getItem(STORAGE_KEYS.department) || "",
    token: sessionStorage.getItem(STORAGE_KEYS.token) || localStorage.getItem(STORAGE_KEYS.token) || "",
  };
};

const persistUser = (user) => {
  if (!user) return;
  localStorage.setItem(STORAGE_KEYS.name, user.name || "");
  localStorage.setItem(STORAGE_KEYS.role, user.role || "");
  localStorage.setItem(STORAGE_KEYS.email, user.email || "");
  localStorage.setItem(STORAGE_KEYS.userId, user.userId || "");
  localStorage.setItem(STORAGE_KEYS.department, user.department || "");

  if (user.token) {
    sessionStorage.setItem(STORAGE_KEYS.token, user.token);
    localStorage.setItem(STORAGE_KEYS.token, user.token);
  }
};

const clearStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const stored = readFromStorage();
    if (stored) setUser(stored);
    setIsHydrating(false);
  }, []);

  const setAuth = useCallback((nextUser) => {
    if (!nextUser) {
      clearStorage();
      setUser(null);
      return;
    }
    persistUser(nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore; still clear client state
    } finally {
      clearStorage();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isHydrating,
      isAuthenticated: !!user?.name,
      setAuth,
      logout,
    }),
    [user, isHydrating, setAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
