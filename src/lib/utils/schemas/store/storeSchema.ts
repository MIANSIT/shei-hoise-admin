import * as z from "zod";

export const storeSchema = z.object({
  owner_id: z.string().uuid("Owner ID must be a valid UUID"),
  store_name: z.string().min(1, "Store name is required"),
  store_slug: z.string().min(1, "Store slug is required"),
  description: z.string().optional(),
  logo_url: z.string().url("Must be a valid URL").optional(),
  banner_url: z.string().url("Must be a valid URL").optional(),
  contact_email: z.string().email("Invalid email").optional(),
  contact_phone: z.string().optional(),
  business_address: z.string().optional(),
  business_license: z.string().optional(),
  tax_id: z.string().optional(),
  status: z.enum(["pending", "approved", "suspended", "rejected"]).optional(),
  approved_by: z.string().uuid().optional(),
  approved_at: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type StoreFormData = z.infer<typeof storeSchema>;
