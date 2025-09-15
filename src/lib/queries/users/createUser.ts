"use server";

import { CreateUserType, createUserSchema } from "@/lib/schema/user.schema";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function createUser(data: CreateUserType) {
  const payload = createUserSchema.parse(data);
  let userId: string | null = null;
  let storeId: string | null = null;

  try {
    // 1️⃣ Create Supabase Auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          first_name: payload.first_name,
          last_name: payload.last_name,
          user_type: payload.user_type,
        },
      });

    if (authError) {
      console.error("Auth creation error:", authError);
      throw authError;
    }

    userId = authData.user.id;
    console.log("Auth user created, ID:", userId);

    // 2️⃣ Insert into users table
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      email: payload.email,
      password_hash: "AUTH_MANAGED",
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone || null,
      user_type: payload.user_type,
      email_verified: true,
      is_active: true,
    });

    if (userError) {
      console.error("Users table insert error:", userError);
      throw userError;
    }

    // 3️⃣ Insert profile if exists
    if (payload.profile) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          ...payload.profile,
        });

      if (profileError) {
        console.error("Profile insert error:", profileError);
        throw profileError;
      }
    }

    // 4️⃣ Insert store for store_owner
    if (payload.user_type === "store_owner" && payload.store) {
      console.log("Creating store:", payload.store);
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .insert({ owner_id: userId, ...payload.store })
        .select("id")
        .single();

      if (storeError) {
        console.error("Store insert error:", storeError);
        throw storeError;
      }

      storeId = storeData.id;
      console.log("Store created, ID:", storeId);

      // ✅ Update user with store_id
      const { error: updateUserError } = await supabase
        .from("users")
        .update({ store_id: storeId })
        .eq("id", userId);

      if (updateUserError) {
        console.error("Failed to update user with store_id:", updateUserError);
        throw updateUserError;
      }

      // 5️⃣ Insert store settings if exists
      if (payload.store_settings) {
        const { error: settingsError } = await supabase
          .from("store_settings")
          .insert({
            store_id: storeId,
            ...payload.store_settings,
          });

        if (settingsError) {
          console.error("Store settings insert error:", settingsError);
          throw settingsError;
        }
      }
    }

    return { success: true, userId, storeId };
  } catch (err) {
    console.error("CreateUser failed:", err);

    // 🔄 Rollback: delete auth + user record if created
    if (userId) {
      try {
        await supabase.auth.admin.deleteUser(userId);
        console.log("Rolled back auth user:", userId);
      } catch (deleteErr) {
        console.error("Failed to rollback auth user:", deleteErr);
      }

      try {
        await supabase.from("users").delete().eq("id", userId);
        console.log("Rolled back users table row:", userId);
      } catch (deleteErr) {
        console.error("Failed to rollback users table row:", deleteErr);
      }
    }

    // 🔄 Optionally rollback store if created (safe-guard)
    if (storeId) {
      try {
        await supabase.from("stores").delete().eq("id", storeId);
        console.log("Rolled back store:", storeId);
      } catch (deleteErr) {
        console.error("Failed to rollback store:", deleteErr);
      }
    }

    throw err; // propagate error to client
  }
}
