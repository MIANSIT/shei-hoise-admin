"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CurrentUser, userSchema } from "@/lib/types/users";
import { USER_TYPES, UserType } from "@/lib/types/enums";
import { AdminUserWithProfile } from "@/lib/queries/users/getAdminUser";
import { User } from "@supabase/supabase-js";

export interface CurrentUserWithProfile extends CurrentUser {
  profile?: AdminUserWithProfile | null;
}

/* =======================
   GLOBAL CACHE
======================= */
interface CacheEntry {
  user: CurrentUserWithProfile | null;
  storeSlug: string | null;
  storeId: string | null;
  storeStatus: string | null;
  storeIsActive: boolean | null;
  timestamp: number;
}

let globalUserCache: CacheEntry | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let inflight: Promise<CacheEntry> | null = null;
let inflightUserId: string | null = null;

async function loadUserData(authUser: User): Promise<CacheEntry> {
  const { data: userData, error: dbErr } = await supabase
    .from("users")
    .select("id, email, first_name, last_name, phone, store_id, user_type")
    .eq("id", authUser.id)
    .maybeSingle();

  if (dbErr || !userData) {
    const fallbackUser: CurrentUserWithProfile = {
      id: authUser.id,
      email: authUser.email || "",
      first_name: authUser.user_metadata?.first_name || "",
      last_name: authUser.user_metadata?.last_name || "",
      phone: authUser.user_metadata?.phone || null,
      store_id: null,
      user_type: USER_TYPES.CUSTOMER,
      profile: null,
    };
    return (globalUserCache = {
      user: fallbackUser,
      storeSlug: null,
      storeId: null,
      storeStatus: null,
      storeIsActive: null,
      timestamp: Date.now(),
    });
  }

  const parsedUser = userSchema.parse(userData);

  let storeSlug: string | null = null;
  let storeStatus: string | null = null;
  let storeIsActive: boolean | null = null;

  if (parsedUser.store_id) {
    const { data: storeData } = await supabase
      .from("stores")
      .select("id, store_slug, status, is_active")
      .eq("id", parsedUser.store_id)
      .single();

    if (storeData) {
      storeSlug = storeData.store_slug ?? null;
      storeStatus = storeData.status ?? null;
      storeIsActive = storeData.is_active ?? null;
    }
  }

  return (globalUserCache = {
    user: { ...parsedUser, profile: null },
    storeSlug,
    storeId: parsedUser.store_id || null,
    storeStatus,
    storeIsActive,
    timestamp: Date.now(),
  });
}

/* =======================
   HOOK
======================= */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserWithProfile | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeStatus, setStoreStatus] = useState<string | null>(null);
  const [storeIsActive, setStoreIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let currentAuthUser: User | null = null;

    const fetchUser = async (authUser: User | null) => {
      if (!mounted) return;
      currentAuthUser = authUser;

      try {
        /* =======================
           LOGOUT
        ======================= */
        if (!authUser) {
          setUser(null);
          setStoreSlug(null);
          setStoreId(null);
          setStoreStatus(null);
          setStoreIsActive(null);
          setLoading(false);
          globalUserCache = null;
          return;
        }

        /* =======================
           CACHE CHECK
        ======================= */
        if (
          globalUserCache &&
          globalUserCache.user?.id === authUser.id &&
          Date.now() - globalUserCache.timestamp < CACHE_DURATION
        ) {
          setUser(globalUserCache.user);
          setStoreSlug(globalUserCache.storeSlug);
          setStoreId(globalUserCache.storeId);
          setStoreStatus(globalUserCache.storeStatus);
          setStoreIsActive(globalUserCache.storeIsActive);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Share one in-flight request between every component using this hook
        // (layout, sidebar, profile menu) instead of each querying separately.
        if (!inflight || inflightUserId !== authUser.id) {
          inflightUserId = authUser.id;
          inflight = loadUserData(authUser).finally(() => {
            inflight = null;
            inflightUserId = null;
          });
        }
        const data = await inflight;

        if (!mounted) return;
        setUser(data.user);
        setStoreSlug(data.storeSlug);
        setStoreId(data.storeId);
        setStoreStatus(data.storeStatus);
        setStoreIsActive(data.storeIsActive);
        setLoading(false);
      } catch (err) {
        console.error("❌ useCurrentUser error:", err);
        setError(err as Error);
        setUser(null);
        setStoreSlug(null);
        setStoreId(null);
        setStoreStatus(null);
        setStoreIsActive(null);
        setLoading(false);
        globalUserCache = null;
      }
    };

    /* =======================
       INITIAL LOAD
    ======================= */
    // getSession reads the local cookie/storage (no network round trip); the
    // middleware has already validated the token server-side.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => fetchUser(session?.user ?? null))
      .catch((err) => {
        setError(err);
        setLoading(false);
      });

    /* =======================
       AUTH LISTENER
    ======================= */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (currentAuthUser && session?.user?.id !== currentAuthUser.id) {
        globalUserCache = null;
      }
      fetchUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* =======================
     RETURN
  ======================= */
  return {
    user,
    storeSlug,
    storeId,
    storeStatus,
    storeIsActive,
    loading,
    error,
    role: user?.user_type as UserType,
    profile: user?.profile,
  };
}

/* =======================
   MANUAL CACHE CLEAR
======================= */
export function clearUserCache() {
  globalUserCache = null;
}
