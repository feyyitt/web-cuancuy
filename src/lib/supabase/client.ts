import { createClient } from "@supabase/supabase-js";

let rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
// Normalize URL by removing trailing slash and /rest/v1 if included
if (rawUrl) {
  rawUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

const supabaseUrl = rawUrl;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const isMissingCredentials = !supabaseUrl || !supabaseAnonKey;

if (isMissingCredentials) {
  console.warn(
    "⚠️ Supabase credentials not found. Running in Standalone LocalStorage mode."
  );
}

// Initialize Supabase Client
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export { isMissingCredentials };
