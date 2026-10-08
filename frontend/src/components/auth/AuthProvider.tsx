"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiJson, getToken, setToken } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  has_password: boolean;
  google_linked: boolean;
  created_at: string | null;
}

export interface UserSettings {
  default_model: string;
  temperature: number;
  system_instruction: string | null;
}

interface AuthContextValue {
  user: User | null;
  settings: UserSettings | null;
  loading: boolean;
  googleClientId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
  updateSettings: (s: Partial<UserSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setSettings(null);
      setLoading(false);
      return;
    }
    try {
      const [{ user }, s] = await Promise.all([
        apiJson<{ user: User }>("/api/auth/me"),
        apiJson<UserSettings>("/api/me/settings"),
      ]);
      setUser(user);
      setSettings(s);
    } catch {
      setToken(null);
      setUser(null);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
    apiJson<{ google_client_id: string | null }>("/api/auth/config")
      .then((c) => setGoogleClientId(c.google_client_id))
      .catch(() => {});
    const onLogout = () => {
      setUser(null);
      setSettings(null);
    };
    // Keep multiple tabs in sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === "vantage_token") loadSession();
    };
    window.addEventListener("vantage:logout", onLogout);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("vantage:logout", onLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadSession]);

  const handleSession = async (p: Promise<{ token: string; user: User }>) => {
    const { token, user } = await p;
    setToken(token);
    setUser(user);
    try {
      setSettings(await apiJson<UserSettings>("/api/me/settings"));
    } catch {
      /* settings are optional */
    }
  };

  const value: AuthContextValue = {
    user,
    settings,
    loading,
    googleClientId,
    login: (email, password) =>
      handleSession(apiJson("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })),
    register: (email, password, name) =>
      handleSession(apiJson("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) })),
    loginWithGoogle: (credential) =>
      handleSession(apiJson("/api/auth/google", { method: "POST", body: JSON.stringify({ credential }) })),
    logout: () => {
      setToken(null);
      setUser(null);
      setSettings(null);
    },
    setUser,
    updateSettings: async (s) => {
      const next = await apiJson<UserSettings>("/api/me/settings", { method: "PUT", body: JSON.stringify(s) });
      setSettings(next);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
