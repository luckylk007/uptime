"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// -- Types ---------------------------------------------------------------------
export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { user: AuthUser } | null; // kept for backwards-compat with existing components
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string) => Promise<{ error?: string; user?: AuthUser }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
});

// -- Provider ------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // On mount: verify session by calling /api/auth/me
  // The JWT token lives in an httpOnly cookie � no localStorage access needed
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? null);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, pass: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends/receives httpOnly cookie
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error || "Failed to sign in" };

      setUser(data.user);
      return {};
    } catch (err: any) {
      return { error: err?.message || "Failed to sign in" };
    }
  };

  const signUp = async (email: string, pass: string): Promise<{ error?: string; user?: AuthUser }> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error || "Failed to create account" };

      setUser(data.user);
      return { user: data.user };
    } catch (err: any) {
      return { error: err?.message || "Failed to create account" };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors � still clear local state
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: user ? { user } : null,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
