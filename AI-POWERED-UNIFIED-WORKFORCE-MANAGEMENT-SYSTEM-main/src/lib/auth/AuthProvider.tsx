"use client";

import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isProfileRole } from "@/lib/auth/permissions";
import type { Profile, ProfileRole } from "@/types/database";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  role: ProfileRole | null;
  loading: boolean;
  profileLoaded: boolean;
  configured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function formatAuthError(message: string) {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }

  return "We could not connect to authentication. Please try again.";
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setProfileLoaded(true);
      return;
    }

    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (profileError) {
      setError("Your account is signed in, but its workforce profile could not be loaded.");
      setProfile(null);
      setProfileLoaded(true);
      return;
    }

    if (!data || !isProfileRole(data.role)) {
      setError("Your workforce profile is missing a valid role. Ask an administrator to update it.");
      setProfile(null);
      setProfileLoaded(true);
      return;
    }

    setProfile(data as Profile);
    setProfileLoaded(true);
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (sessionError) {
        setError("Your session could not be restored. Please sign in again.");
      }

      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) {
      return;
    }

    let cancelled = false;
    const loadProfile = async () => {
      const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      if (cancelled) {
        return;
      }

      if (profileError) {
        setError("Your account is signed in, but its workforce profile could not be loaded.");
        setProfile(null);
        setProfileLoaded(true);
        return;
      }

      if (!data || !isProfileRole(data.role)) {
        setError("Your workforce profile is missing a valid role. Ask an administrator to update it.");
        setProfile(null);
        setProfileLoaded(true);
        return;
      }

      setProfile(data as Profile);
      setProfileLoaded(true);
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: "Authentication is not configured. Add the Supabase variables to .env.local." };
    }

    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      return { error: formatAuthError(signInError.message) };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      return { error: null };
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return { error: "We could not sign you out. Please try again." };
    }

    setUser(null);
    setProfile(null);
    setProfileLoaded(true);
    return { error: null };
  };

  const value = {
    user,
    profile,
    profileLoaded,
    role: profile?.role ?? null,
    loading,
    configured: Boolean(supabase),
    error,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}