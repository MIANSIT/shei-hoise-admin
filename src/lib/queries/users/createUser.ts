// lib/actions/users/createUser.ts
"use server";

import { createUserSchema, CreateUserType } from "@/lib/schema/user.schema";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { createUserCore } from "@/lib/queries/users/store/createUserCore";
import { createStoreWithSettings } from "@/lib/queries/users/store/createStoreWithSettings";

export async function createUser(data: CreateUserType) {
  // ✅ Validate input once (single source of truth)
  const payload = createUserSchema.parse(data);

  let userId: string | null = null;
  let storeId: string | null = null;

  try {
    // 1️⃣ Create user + user profile
    userId = await createUserCore(payload);

    // 2️⃣ Create store only for store_owner
    if (payload.user_type === "store_owner") {
      storeId = await createStoreWithSettings({
        ownerId: userId,
        store: payload.store,
        settings: payload.store_settings,
      });

      // 3️⃣ Link user → store
      const { error: linkError } = await supabase
        .from("users")
        .update({ store_id: storeId })
        .eq("id", userId);

      if (linkError) throw linkError;
    }

    return {
      success: true,
      userId,
      storeId,
    };
  } catch (err) {
    console.error("createUser failed:", err);

    // 🔄 ROLLBACK (ORDER MATTERS)

    // 1️⃣ Delete store (cascades store_settings, store_profile if exists)
    if (storeId) {
      await supabase.from("stores").delete().eq("id", storeId);
    }

    // 2️⃣ Delete user (cascades user_profile)
    if (userId) {
      await supabase.from("users").delete().eq("id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }

    throw err;
  }
}
