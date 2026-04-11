import { CreateUserType } from "@/lib/schema/onboarding/user.schema";

export type UserWithRelationsType = CreateUserType & {
  id: string;
  user_profiles?: Array<NonNullable<CreateUserType["profile"]>>;
  stores?: Array<
    NonNullable<CreateUserType["store"]> & {
      id: string;
      is_active: boolean; // <-- Add this
      created_at: string; // ← add this
      store_settings?: Array<
        NonNullable<CreateUserType["store_settings"]> & { id: string }
      >;
    }
  >;
};
