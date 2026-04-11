import { supabase } from "@/lib/supabase";
import { UserType } from "@/lib/types/enums";

export interface AdminUserProfile {
  id: string;
  user_id: string;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminUserWithProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  user_type: UserType | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  store_id: string | null;
  store_slug: string | null;
  store_name: string | null;
  profile: AdminUserProfile | null;
}

export async function getAdminProfile(
  userId: string,
): Promise<AdminUserWithProfile> {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select(`*, user_profiles (*)`)
    .eq("id", userId)
    .single();

  if (userError) {
    throw new Error(`Failed to fetch user profile: ${userError.message}`);
  }

  let storeSlug = null;
  let storeName = null;
  if (userData.store_id) {
    const { data: storeData, error: storeError } = await supabase
      .from("stores")
      .select("store_slug, store_name")
      .eq("id", userData.store_id)
      .single();

    if (!storeError && storeData) {
      storeSlug = storeData.store_slug;
      storeName = storeData.store_name;
    }
  }

  return {
    ...userData,
    store_slug: storeSlug,
    store_name: storeName,
    profile: userData.user_profiles?.[0] || null,
  };
}
