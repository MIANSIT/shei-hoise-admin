"use server";

import { supabaseAdmin } from "@/lib/supabase";
import {
  SubscriptionStatus,
  UpdateStoreSubscriptionInput,
} from "@/lib/types/subscription.types";

export async function updateStoreSubscription(
  id: string,
  input: UpdateStoreSubscriptionInput
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("store_subscriptions")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("updateStoreSubscription failed:", err);
    return { success: false, error: err };
  }
}

export async function cancelStoreSubscription(
  id: string,
  cancelAtPeriodEnd = false
) {
  const now = new Date().toISOString();
  return updateStoreSubscription(id, {
    canceled_at: now,
    cancels_at_period_end: cancelAtPeriodEnd,
    ...(cancelAtPeriodEnd
      ? {}
      : { status: SubscriptionStatus.CANCELED }),
  });
}
