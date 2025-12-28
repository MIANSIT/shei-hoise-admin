import { CreateUserType } from "./user.schema";

export type UserWithRelationsType = CreateUserType & {
  id: string;
  user_profiles?: Array<NonNullable<CreateUserType["profile"]>>;
  stores?: Array<
    NonNullable<CreateUserType["store"]> & {
      id: string;
      is_active: boolean; // <-- Add this
      store_settings?: Array<
        NonNullable<CreateUserType["store_settings"]> & { id: string }
      >;
    }
  >;
};
