"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { CreateStoreSubscriptionInput } from "@/lib/types/subscription.types";

export async function createStoreSubscription(
  input: CreateStoreSubscriptionInput
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("store_subscriptions")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("createStoreSubscription failed:", err);
    return { success: false, error: err };
  }
}
