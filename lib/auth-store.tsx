"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";

export interface SageUser {
  name: string;
  email: string;
}

interface AuthStore {
  user: SageUser | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthStore | null>(null);

const USER_KEY = "sage-user";
const COOKIE_KEY = "sage-user";

function loadUser(): SageUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.email === "string" && typeof p.name === "string") return p as SageUser;
    return null;
  } catch {
    return null;
  }
}

function saveUser(u: SageUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (u) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(u));
      document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(u))}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      window.localStorage.removeItem(USER_KEY);
      document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
    }
  } catch {
    /* non-fatal */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SageUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setReady(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const e = email.trim().toLowerCase();
    if (!e || !password.trim()) return false;
    const name = e.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "User";
    const u: SageUser = { name, email: e };
    setUser(u);
    saveUser(u);
    return true;
  }, []);

  const signup = useCallback((name: string, email: string, password: string) => {
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (!n || !e || !password.trim()) return false;
    const u: SageUser = { name: n, email: e };
    setUser(u);
    saveUser(u);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  if (!ready) return null;

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthStore {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
