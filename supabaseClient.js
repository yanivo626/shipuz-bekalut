import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Doesn't throw — the app shows a clear setup message instead of a blank
  // white screen if someone forgets to configure their .env file.
  console.error(
    "חסרים VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — ראו README.md."
  );
}

export const supabase = createClient(url || "", anonKey || "");
