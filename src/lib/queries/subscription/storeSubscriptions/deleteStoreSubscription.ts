"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

export async function deleteStoreSubscription(id: string) {
  try {
    await requireSuperAdmin();
    const { error } = await supabaseAdmin
      .from("store_subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deleteStoreSubscription failed:", err);
    return { success: false, error: err };
  }
}
