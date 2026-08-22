"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string) => Promise<{ error?: string; user?: any }>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Check localStorage for offline demo user if any
      const savedUser = localStorage.getItem("pulsecheck_demo_user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Demo login
      const demoUser: any = {
        id: "demo-user-123",
        email,
        created_at: new Date().toISOString(),
      };
      setUser(demoUser);
      localStorage.setItem("pulsecheck_demo_user", JSON.stringify(demoUser));
      return {};
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) return { error: error.message };
    setUser(data.user);
    setSession(data.session);
    return {};
  };

  const signUp = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const demoUser: any = {
        id: "demo-user-123",
        email,
        created_at: new Date().toISOString(),
      };
      setUser(demoUser);
      localStorage.setItem("pulsecheck_demo_user", JSON.stringify(demoUser));
      return { user: demoUser };
    }

    const { error, data } = await supabase.auth.signUp({
      email,
      password: pass,
    });

    if (error) return { error: error.message };
    if (data.user) {
      setUser(data.user);
      setSession(data.session);
    }
    return { user: data.user };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("pulsecheck_demo_user");
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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