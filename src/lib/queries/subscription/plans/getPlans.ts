"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { SubscriptionPlan } from "@/lib/types/subscription.types";

export async function getSubscriptionPlans() {
  try {
    await requireSuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { success: true, data: data as SubscriptionPlan[] };
  } catch (err) {
    console.error("getSubscriptionPlans failed:", err);
    return { success: false, error: err, data: [] as SubscriptionPlan[] };
  }
}
