// lib/queries/getAllRequest.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

export const getAllRequest = async () => {
  try {
    await requireSuperAdmin();
  } catch (err) {
    console.error("getAllRequest denied:", err);
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("contact_us")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data;
};

// Toggle is_solved
export const toggleSolved = async (id: string, is_solved: boolean) => {
  try {
    await requireSuperAdmin();
  } catch (err) {
    console.error("toggleSolved denied:", err);
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("contact_us")
    .update({ is_solved })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating is_solved:", error);
    return null;
  }
  return data;
};
