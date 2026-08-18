import { supabase } from "@/lib/supabase/client";
import { AUTH_EMAIL_DOMAIN } from "@/constants";
import type { Profile } from "@/types";

/**
 * Convert username to internal email format for Supabase Auth.
 */
function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

/**
 * Register a new user with username and password.
 */
export async function registerUser(
  fullName: string,
  username: string,
  password: string
): Promise<{ user: Profile | null; error: string | null }> {
  const email = usernameToEmail(username);

  // Check if username is already taken
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username.toLowerCase())
    .single();

  if (existingProfile) {
    return { user: null, error: "Username sudah digunakan" };
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username.toLowerCase(),
      },
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return { user: null, error: "Username sudah digunakan" };
    }
    return { user: null, error: "Gagal membuat akun. Coba lagi." };
  }

  if (!authData.user) {
    return { user: null, error: "Gagal membuat akun." };
  }

  // Create profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authData.user.id,
      full_name: fullName,
      username: username.toLowerCase(),
    })
    .select()
    .single();

  if (profileError) {
    console.error("Profile creation error:", profileError);
    // Profile might be created by a trigger, try to fetch it
    const { data: fetchedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (fetchedProfile) {
      // Create default settings
      await supabase.from("app_settings").insert({
        user_id: authData.user.id,
      });
      return { user: fetchedProfile as Profile, error: null };
    }
    return { user: null, error: "Gagal membuat profil." };
  }

  // Create default settings
  await supabase.from("app_settings").insert({
    user_id: authData.user.id,
  });

  return { user: profile as Profile, error: null };
}

/**
 * Login with username and password.
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ error: string | null }> {
  const email = usernameToEmail(username);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login")) {
      return { error: "Username atau password salah" };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Akun belum terverifikasi" };
    }
    return { error: "Gagal masuk. Periksa koneksi internet kamu." };
  }

  return { error: null };
}

/**
 * Logout the current user.
 */
export async function logoutUser(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: "Gagal keluar. Coba lagi." };
  }
  return { error: null };
}

/**
 * Get the current user's profile.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data as Profile;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "avatar_url">>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { error: "Gagal memperbarui profil." };
  }
  return { error: null };
}
