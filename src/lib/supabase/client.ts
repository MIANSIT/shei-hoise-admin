import { createBrowserClient } from "@supabase/ssr";

// Get these from your Supabase project settings
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createNormalClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
