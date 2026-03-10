import { z } from "zod";
import { AdminUserWithProfile } from "@/lib/queries/users/getAdminUser";
import { USER_TYPES, UserType } from "./enums";

export const customerProfileSchema = z.object({
  user_id: z.string().uuid(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string().nullable(),
  store_id: z.string().uuid().nullable(),
  user_type: z.enum(Object.values(USER_TYPES) as [UserType, ...UserType[]]),
});

export type CurrentUser = z.infer<typeof userSchema>;

export interface TableCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: "active" | "inactive";
  order_count?: number;
  last_order_date?: string;
  source?: "direct" | "orders";
}

export interface DetailedCustomer extends TableCustomer {
  first_name?: string | null;
  last_name?: string | null;
  user_type?: UserType | string;
  email_verified?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  store_slug?: string;
  store_name?: string;
  profile_id?: string | null;
  profile_details?: {
    id?: string;
    avatar_url?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    address_line_1?: string | null;
    address?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
}

export type AnyUserProfile = AdminUserWithProfile;
