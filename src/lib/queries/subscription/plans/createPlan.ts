"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { CreatePlanInput } from "@/lib/types/subscription.types";

export async function createSubscriptionPlan(input: CreatePlanInput) {
  try {
    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("createSubscriptionPlan failed:", err);
    return { success: false, error: err };
  }
}
