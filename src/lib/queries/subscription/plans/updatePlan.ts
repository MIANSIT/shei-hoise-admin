"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { CreatePlanInput } from "@/lib/types/subscription.types";

export async function updateSubscriptionPlan(
  id: string,
  input: Partial<CreatePlanInput>
) {
  try {
    if (input.is_default_trial_plan) {
      const { error: clearError } = await supabaseAdmin
        .from("subscription_plans")
        .update({ is_default_trial_plan: false })
        .neq("id", id)
        .eq("is_default_trial_plan", true);

      if (clearError) throw clearError;
    }

    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("updateSubscriptionPlan failed:", err);
    return { success: false, error: err };
  }
}
