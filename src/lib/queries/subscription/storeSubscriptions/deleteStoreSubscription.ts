"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function deleteStoreSubscription(id: string) {
  try {
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
