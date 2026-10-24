import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { USER_TYPES } from "@/lib/types/enums";

// Super-admin sessions already verified by Supabase, keyed by the exact access
// token (never populated from an unverified token). Skips the two network
// round trips on back-to-back dashboard navigations; the short TTL bounds how
// long a revoked admin could keep getting through in this runtime instance.
const VERIFIED_TTL_MS = 30 * 1000;
const verifiedTokens = new Map<string, number>();

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (token) {
    const expires = verifiedTokens.get(token);
    if (expires && expires > Date.now()) return supabaseResponse;
  }

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request);
  }

  // The dashboard is super-admin only. Resolve the caller's role from the
  // `users` table rather than trusting anything client-supplied. Anything we
  // can't positively confirm as super_admin gets bounced.
  const { data: profile, error } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.user_type !== USER_TYPES.SUPER_ADMIN) {
    return redirectToLogin(request);
  }

  if (token) {
    if (verifiedTokens.size > 200) verifiedTokens.clear();
    verifiedTokens.set(token, Date.now() + VERIFIED_TTL_MS);
  }

  return supabaseResponse;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}
