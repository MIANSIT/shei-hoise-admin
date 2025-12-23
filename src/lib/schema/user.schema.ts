import { z } from "zod";
import { STORE_STATUS, USER_TYPES } from "@/lib/types/enums";
// Profile schema
const userProfileSchema = z.object({
  avatar_url: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string(),
});

const fileOrUrl = z.union([z.instanceof(File), z.string().url()]);

const requiredFileOrUrl = fileOrUrl.refine(
  (val) => {
    if (typeof val === "string") return val.trim().length > 0;
    return val instanceof File;
  },
  { message: "This field is required" }
);

// Store schema
const storeSchema = z.object({
  store_name: z.string().nonempty("Store name is required"),
  store_slug: z.string().nonempty("Store slug is required"),
  logo_url: requiredFileOrUrl,
  banner_url: requiredFileOrUrl,

  description: z.string().optional(),
  status: z.enum([
    STORE_STATUS.PENDING,
    STORE_STATUS.APPROVED,
    STORE_STATUS.SUSPENDED,
    STORE_STATUS.TRIAL,
  ]),
  contact_email: z.email(),
  contact_phone: z.string().nonempty("Store Phone Number Required"),
  business_address: z.string().nonempty("Store Address Required"),
  business_license: z.string().optional(),
  tax_id: z.string().optional(),
});

// Store settings schema
const storeSettingsSchema = z.object({
  currency: z.string().nonempty("Currency Required"),
  tax_rate: z.number(),
  shipping_fees: z
    .array(
      z.object({
        name: z.string(), // allow any string
        price: z.number().min(0),
      })
    )
    .min(1, { message: "At least one shipping fee is required" }),

  free_shipping_threshold: z.number().optional(),
  min_order_amount: z.number(),
  processing_time_days: z.number(),
  return_policy_days: z.number(),
  terms_and_conditions: z.string().optional(),
  privacy_policy: z.string().optional(),
});

// Main user schema
export const createUserSchema = z.object({
  email: z.email().nonempty("Email Required"),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Must contain an uppercase letter" })
    .regex(/[a-z]/, { message: "Must contain a lowercase letter" })
    .regex(/[0-9]/, { message: "Must contain a number" })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: "Must contain a special character",
    }),

  first_name: z.string().nonempty("First name is required"),
  last_name: z.string().nonempty("Last name is required"),
  phone: z.string().nonempty("Phone number is required"),

  user_type: z.enum(USER_TYPES),

  profile: userProfileSchema.optional(),
  store: storeSchema,
  store_settings: storeSettingsSchema.optional(),
  is_active: z.boolean(),
});

export type CreateUserType = z.infer<typeof createUserSchema>;
