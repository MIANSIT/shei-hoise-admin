import { CreateUserType, createUserSchema } from "@/lib/schema/user.schema";
import { supabase } from "@/lib/supabase";

export async function createUser(data: CreateUserType) {
  // Validate input using Zod
  const payload = createUserSchema.parse(data);

  // 1. Create Supabase Auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        user_type: payload.user_type,
      },
    });

  if (authError) throw authError;
  const userId = authData.user.id;

  try {
    // Insert into users table
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      email: payload.email,
      password_hash: "AUTH_MANAGED", // Supabase Auth handles password
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone,
      user_type: payload.user_type,
      email_verified: true,
      is_active: true,
    });

    if (userError) throw userError;

    // Insert user profile
    if (payload.profile) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          ...payload.profile,
        });
      if (profileError) throw profileError;
    }

    // Insert store for store_owner
    if (payload.user_type === "store_owner" && payload.store) {
      const { data: storeData, error: storeError } = await supabase
        .from("stores")
        .insert({ owner_id: userId, ...payload.store })
        .select("id")
        .single();
      if (storeError) throw storeError;

      // Insert store settings
      if (payload.store_settings) {
        const { error: settingsError } = await supabase
          .from("store_settings")
          .insert({
            store_id: storeData.id,
            ...payload.store_settings,
          });
        if (settingsError) throw settingsError;
      }
    }

    return { success: true, userId };
  } catch (err) {
    // Rollback: delete Supabase Auth user if any insert fails
    await supabase.auth.admin.deleteUser(userId);
    throw err;
  }
}
