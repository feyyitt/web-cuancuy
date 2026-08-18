import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase, isMissingCredentials } from "@/lib/supabase/client";
import { authService } from "@/services/dataProvider";
import type { Profile } from "@/types";

export function useAuth() {
  const {
    user,
    profile,
    session,
    isLoading,
    isInitialized,
    setUser,
    setProfile,
    setSession,
    setLoading,
    setInitialized,
    reset,
  } = useAuthStore();

  useEffect(() => {
    // If running in demo mode without Supabase credentials
    if (isMissingCredentials) {
      const demoUser = localStorage.getItem("profitly_demo_user");
      if (demoUser) {
        try {
          const parsed = JSON.parse(demoUser);
          const localProfile = localStorage.getItem("profitly_profile");
          const prof: Profile = localProfile
            ? JSON.parse(localProfile)
            : {
                id: "demo-user-id",
                full_name: "Owner Cuan Cuy",
                username: "demo_bisnis",
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
          setUser(parsed as any);
          setProfile(prof);
          setSession({
            access_token: "demo-token",
            refresh_token: "demo-refresh",
            expires_in: 3600,
            token_type: "bearer",
            user: parsed as any,
          } as any);
        } catch (e) {
          console.error("Error reading demo user:", e);
        }
      }
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Real Supabase Auth initialization
    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const userProfile = await authService.getProfile(currentSession.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === "SIGNED_IN" && newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        const userProfile = await authService.getProfile(newSession.user.id);
        setProfile(userProfile);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        reset();
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        setSession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile, setSession, setLoading, setInitialized, reset]);

  return {
    user,
    profile,
    session,
    isLoading,
    isInitialized,
    isAuthenticated: !!session || (isMissingCredentials && !!localStorage.getItem("profitly_demo_user")),
  };
}
