"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

export async function deleteFaq(id: string) {
  try {
    await requireSuperAdmin();
    const { error } = await supabaseAdmin.from("faqs").delete().eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deleteFaq failed:", err);
    return { success: false, error: err };
  }
}
