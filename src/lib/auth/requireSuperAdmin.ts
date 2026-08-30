import "server-only";

import { createClient } from "@/lib/supabase/server";
import { USER_TYPES } from "@/lib/types/enums";

/**
 * Guard for every server action that touches `supabaseAdmin`.
 *
 * Server actions compile to public POST endpoints — Next.js does not
 * authenticate them, and their ids are discoverable in the client bundle. An
 * unauthenticated caller can invoke one directly, so the middleware gate in
 * src/lib/supabase/middleware.ts does NOT cover them: that only guards page
 * navigations under /dashboard.
 *
 * Throws unless the caller's session belongs to a super admin. Callers wrap
 * this in their existing try/catch, so a rejection surfaces as the usual
 * `{ success: false, error }`.
 */
export async function requireSuperAdmin() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: no active session.");
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.user_type !== USER_TYPES.SUPER_ADMIN) {
    throw new Error("Forbidden: super admin access required.");
  }

  return user;
}
