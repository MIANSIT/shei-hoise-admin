// lib/actions/stores/deleteStore.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function deleteStore(storeId: string) {
  try {
    // 1️⃣ Look up the owner before deleting anything (needed for the
    // toast/UI state update below — the RPC also computes this itself)
    const { data: store, error: fetchError } = await supabaseAdmin
      .from("stores")
      .select("id, owner_id")
      .eq("id", storeId)
      .single();

    if (fetchError) throw fetchError;
    const ownerId = store.owner_id as string | null;

    // 2️⃣ Delete uploaded logo/banner files (non-blocking — a storage hiccup
    // shouldn't stop the row cleanup below)
    try {
      for (const bucket of ["store_logo", "store-banner"]) {
        const { data: files } = await supabaseAdmin.storage
          .from(bucket)
          .list(`store/${storeId}`);
        if (files && files.length > 0) {
          await supabaseAdmin.storage
            .from(bucket)
            .remove(files.map((f) => `store/${storeId}/${f.name}`));
        }
      }
    } catch (storageErr) {
      console.error("deleteStore storage cleanup failed:", storageErr);
    }

    // 3️⃣ Delete the store and every table that references it (products,
    // orders, vendors, carts, subscriptions, dashboard rollups, etc.) in one
    // atomic transaction. See sql/delete_store_cascade.sql — the function
    // must be created once in Supabase before this will work, and returns
    // the ids of any `users` rows it fully removed (store-scoped accounts
    // that don't own another remaining store).
    const { data: deletedUserIds, error: rpcError } = await supabaseAdmin.rpc(
      "delete_store_cascade",
      { p_store_id: storeId },
    );
    if (rpcError) throw rpcError;

    // 4️⃣ Remove Supabase Auth identities for any fully-deleted users
    // (best-effort — the DB rows are already gone either way)
    for (const userId of (deletedUserIds as string[]) ?? []) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (authErr) {
        console.error("Failed to delete Supabase Auth user:", authErr);
      }
    }

    const ownerDeleted = !!ownerId && (deletedUserIds ?? []).includes(ownerId);

    return { success: true, ownerId, ownerDeleted };
  } catch (err) {
    console.error("deleteStore failed:", err);
    return { success: false, error: err };
  }
}
