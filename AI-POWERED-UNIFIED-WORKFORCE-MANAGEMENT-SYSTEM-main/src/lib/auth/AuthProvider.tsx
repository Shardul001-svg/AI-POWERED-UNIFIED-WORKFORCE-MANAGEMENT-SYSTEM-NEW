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

  const resolveProfileForUser = useCallback(
    async (nextUser: User | null) => {
      if (!supabase || !nextUser) {
        console.log("[auth] resolveProfileForUser: no user");
        setProfile(null);
        setProfileLoaded(true);
        return;
      }

      const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", nextUser.id).maybeSingle();

      console.log("[auth] profile lookup", {
        userId: nextUser.id,
        userEmail: nextUser.email,
        dataExists: !!data,
        profileId: data?.id ?? null,
        profileRole: data?.role ?? null,
        profileErrorCode: profileError?.code ?? null,
        profileErrorMessage: profileError?.message ?? null,
        profileErrorDetails: profileError?.details ?? null,
      });

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
      setError(null);
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (!supabase) {
      setProfile(null);
      setProfileLoaded(true);
      return;
    }

    const { data: authUser, error: authUserError } = await supabase.auth.getUser();

    if (authUserError || !authUser.user) {
      setUser(null);
      setProfile(null);
      setProfileLoaded(true);
      return;
    }

    setUser(authUser.user);
    await resolveProfileForUser(authUser.user);
  }, [resolveProfileForUser, supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    const loadSession = async () => {
      const { data: authUser, error: userError } = await supabase.auth.getUser();

      console.log("[auth] getUser", {
        userId: authUser.user?.id ?? null,
        userEmail: authUser.user?.email ?? null,
        userErrorCode: userError?.code ?? null,
        userErrorMessage: userError?.message ?? null,
      });

      if (!mounted) {
        return;
      }

      if (userError) {
        setError("Your session could not be restored. Please sign in again.");
      }

      const nextUser = authUser.user ?? null;
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        void resolveProfileForUser(nextUser);
      } else {
        setProfile(null);
        setProfileLoaded(true);
      }
    };

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);
      void resolveProfileForUser(nextUser);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [resolveProfileForUser, supabase]);

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