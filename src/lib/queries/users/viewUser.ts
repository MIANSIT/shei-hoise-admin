"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function viewStoreOwners() {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        user_type,
        is_active,
        user_profiles!user_id (*),
        stores!owner_id (
          id,
          store_name,
          store_slug,
          description,
          logo_url,
          banner_url,
          is_active,   
          status,
           created_at, 
          store_settings!store_id (*)
        )
      `,
      )
      .eq("user_type", "store_owner");

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("viewStoreOwners failed:", err);
    return { success: false, error: err };
  }
}
