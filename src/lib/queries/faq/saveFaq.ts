"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { FaqInput } from "@/lib/types/faq.types";

export async function createFaq(input: FaqInput) {
  try {
    await requireSuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("faqs")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("createFaq failed:", err);
    return { success: false, error: err };
  }
}

export async function updateFaq(id: string, input: Partial<FaqInput>) {
  try {
    await requireSuperAdmin();
    const { data, error } = await supabaseAdmin
      .from("faqs")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("updateFaq failed:", err);
    return { success: false, error: err };
  }
}
