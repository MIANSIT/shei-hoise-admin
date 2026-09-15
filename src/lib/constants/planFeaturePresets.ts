// Shared preset feature/limit keys for subscription plans — used by the plan
// editor (PlanFormModal) and the plan pitch PDF so both stay in sync.

export const PRESET_FEATURES = [
  { key: "pos", label: "POS" },
  { key: "analytics", label: "Analytics" },
  { key: "custom_domain", label: "Custom Domain" },
  { key: "priority_support", label: "Priority Support" },
  { key: "api_access", label: "API Access" },
  { key: "bulk_import", label: "Bulk Import" },
  { key: "export_data", label: "Export Data" },
  { key: "seo_tools", label: "SEO Tools" },
  { key: "advanced_reports", label: "Advanced Reports" },
  { key: "conversion_api", label: "Conversions API" },
  { key: "meta_pixel", label: "Meta Pixel" },
  { key: "expense_tracking", label: "Expense Tracking" },
  { key: "courier_tracking", label: "Courier Tracking" },
  { key: "vendor_flow", label: "Vendor Flow" },
  { key: "storefront_design", label: "Storefront Design" },
  { key: "custom_store_design", label: "Custom Store Design" },
];

export const PRESET_LIMITS = [
  { key: "max_products", label: "Max Products" },
  { key: "max_orders_per_month", label: "Max Orders/Month" },
  { key: "max_images_per_product", label: "Max Images/Product" },
  { key: "max_variants_per_product", label: "Max Variants/Product" },
  { key: "max_staff", label: "Max Staff" },
  { key: "max_users", label: "Max Users" },
  { key: "max_categories", label: "Max Categories" },
  { key: "max_coupons", label: "Max Coupons" },
];

const FEATURE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  PRESET_FEATURES.map((f) => [f.key, f.label])
);
const LIMIT_LABEL_MAP: Record<string, string> = Object.fromEntries(
  PRESET_LIMITS.map((l) => [l.key, l.label])
);

function titleCase(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function featureLabel(key: string): string {
  return FEATURE_LABEL_MAP[key] ?? titleCase(key);
}

export function limitLabel(key: string): string {
  return LIMIT_LABEL_MAP[key] ?? titleCase(key);
}
