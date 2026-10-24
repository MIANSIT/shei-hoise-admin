"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { CreatePlanInput } from "@/lib/types/subscription.types";

export async function createSubscriptionPlan(input: CreatePlanInput) {
  try {
    await requireSuperAdmin();
    if (input.is_default_trial_plan) {
      const { error: clearError } = await supabaseAdmin
        .from("subscription_plans")
        .update({ is_default_trial_plan: false })
        .eq("is_default_trial_plan", true);

      if (clearError) throw clearError;
    }

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
