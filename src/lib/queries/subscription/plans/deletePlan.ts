"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function deleteSubscriptionPlan(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from("subscription_plans")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deleteSubscriptionPlan failed:", err);
    return { success: false, error: err };
  }
}
