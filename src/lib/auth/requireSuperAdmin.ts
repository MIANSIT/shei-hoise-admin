import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
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
// Verified super-admin sessions, keyed by the exact access token. An entry is
// only ever written after Supabase has verified the token AND the role lookup
// passed, so a forged or unknown token can never hit the cache. The short TTL
// bounds how long a demoted/revoked admin keeps working in this process.
const VERIFIED_TTL_MS = 30 * 1000;
const verified = new Map<string, { user: User; expires: number }>();
const pending = new Map<string, Promise<User>>();

async function verifySuperAdmin(
  supabase: ReturnType<typeof createClient>,
): Promise<User> {
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

export async function requireSuperAdmin() {
  const supabase = createClient();

  // getSession only reads the cookie (no network, no verification) - it is
  // used purely to build the cache key, never to trust the caller.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Unauthorized: no active session.");
  }

  const hit = verified.get(token);
  if (hit && hit.expires > Date.now()) return hit.user;

  // Concurrent actions on the same page share a single verification.
  let inflight = pending.get(token);
  if (!inflight) {
    inflight = verifySuperAdmin(supabase)
      .then((user) => {
        if (verified.size > 200) verified.clear();
        verified.set(token, { user, expires: Date.now() + VERIFIED_TTL_MS });
        return user;
      })
      .finally(() => pending.delete(token));
    pending.set(token, inflight);
  }
  return inflight;
}
