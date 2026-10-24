"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { SimpleStore } from "@/lib/types/subscription.types";

export async function getAllStoresForDropdown() {
  try {
    await requireSuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("stores")
      .select("id, store_name, store_slug, owner_id")
      .order("store_name", { ascending: true });

    if (error) throw error;
    return { success: true, data: data as SimpleStore[] };
  } catch (err) {
    console.error("getAllStoresForDropdown failed:", err);
    return { success: false, error: err, data: [] as SimpleStore[] };
  }
}
