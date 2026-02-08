"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getSessionToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'arc-forge-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const { token, expiresAt } = JSON.parse(stored);
        if (expiresAt > Date.now()) {
          setSessionToken(token);
          setIsAuthenticated(true);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Store session
      const expiresAt = Date.now() + data.expiresIn;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        token: data.token,
        expiresAt,
      }));

      setSessionToken(data.token);
      setIsAuthenticated(true);

      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setSessionToken(null);
    setIsAuthenticated(false);
  };

  const getSessionToken = () => sessionToken;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, getSessionToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
