"use client";

import { useEffect, useState } from "react";
import { Modal, Switch } from "antd";
import { Plus, X } from "lucide-react";
import { SubscriptionPlan, CreatePlanInput } from "@/lib/types/subscription.types";

interface PlanFormModalProps {
  open: boolean;
  plan?: SubscriptionPlan | null;
  onClose: () => void;
  onSave: (input: CreatePlanInput, id?: string) => Promise<void>;
}

type FeatureItem = { key: string; enabled: boolean };
type LimitItem = { key: string; value: number };

const PRESET_FEATURES = [
  { key: "pos", label: "POS" },
  { key: "analytics", label: "Analytics" },
  { key: "custom_domain", label: "Custom Domain" },
  { key: "priority_support", label: "Priority Support" },
  { key: "api_access", label: "API Access" },
  { key: "bulk_import", label: "Bulk Import" },
  { key: "export_data", label: "Export Data" },
  { key: "seo_tools", label: "SEO Tools" },
  { key: "advanced_reports", label: "Advanced Reports" },
];

const PRESET_LIMITS = [
  { key: "max_products", label: "Max Products" },
  { key: "max_orders_per_month", label: "Max Orders/Month" },
  { key: "max_images_per_product", label: "Max Images/Product" },
  { key: "max_staff", label: "Max Staff" },
  { key: "max_categories", label: "Max Categories" },
  { key: "max_coupons", label: "Max Coupons" },
];

const DEFAULT_FORM: CreatePlanInput = {
  name: "",
  slug: "",
  description: "",
  price_monthly: 0,
  price_yearly: 0,
  currency: "BDT",
  trial_days: 0,
  is_active: true,
  is_featured: false,
  is_public: true,
  sort_order: 0,
  features: {},
  limits: {},
};

function toFeatureItems(obj: Record<string, unknown>): FeatureItem[] {
  return Object.entries(obj).map(([key, v]) => ({ key, enabled: !!v }));
}
function toLimitItems(obj: Record<string, unknown>): LimitItem[] {
  return Object.entries(obj).map(([key, v]) => ({ key, value: Number(v) }));
}

export function PlanFormModal({ open, plan, onClose, onSave }: PlanFormModalProps) {
  const [form, setForm] = useState<CreatePlanInput>(DEFAULT_FORM);
  const [featureItems, setFeatureItems] = useState<FeatureItem[]>([]);
  const [limitItems, setLimitItems] = useState<LimitItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        slug: plan.slug,
        description: plan.description ?? "",
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        currency: plan.currency,
        trial_days: plan.trial_days,
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        is_public: plan.is_public,
        sort_order: plan.sort_order,
        features: plan.features,
        limits: plan.limits,
      });
      setFeatureItems(toFeatureItems(plan.features));
      setLimitItems(toLimitItems(plan.limits));
    } else {
      setForm(DEFAULT_FORM);
      setFeatureItems([]);
      setLimitItems([]);
    }
  }, [plan, open]);

  const set = <K extends keyof CreatePlanInput>(key: K, value: CreatePlanInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ── Features helpers ── */
  const addFeature = (key: string) => {
    if (!key.trim() || featureItems.some((f) => f.key === key)) return;
    setFeatureItems((prev) => [...prev, { key: key.trim(), enabled: true }]);
  };
  const removeFeature = (key: string) =>
    setFeatureItems((prev) => prev.filter((f) => f.key !== key));
  const toggleFeature = (key: string, enabled: boolean) =>
    setFeatureItems((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
  const updateFeatureKey = (oldKey: string, newKey: string) =>
    setFeatureItems((prev) =>
      prev.map((f) => (f.key === oldKey ? { ...f, key: newKey } : f))
    );

  /* ── Limits helpers ── */
  const addLimit = (key: string) => {
    if (!key.trim() || limitItems.some((l) => l.key === key)) return;
    setLimitItems((prev) => [...prev, { key: key.trim(), value: 100 }]);
  };
  const removeLimit = (key: string) =>
    setLimitItems((prev) => prev.filter((l) => l.key !== key));
  const updateLimitValue = (key: string, value: number) =>
    setLimitItems((prev) => prev.map((l) => (l.key === key ? { ...l, value } : l)));
  const updateLimitKey = (oldKey: string, newKey: string) =>
    setLimitItems((prev) =>
      prev.map((l) => (l.key === oldKey ? { ...l, key: newKey } : l))
    );

  /* ── Submit ── */
  const handleSubmit = async () => {
    const featuresObj = Object.fromEntries(featureItems.map((f) => [f.key, f.enabled]));
    const limitsObj = Object.fromEntries(limitItems.map((l) => [l.key, l.value]));
    setSaving(true);
    await onSave({ ...form, features: featuresObj, limits: limitsObj }, plan?.id);
    setSaving(false);
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";
  const labelCls =
    "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide";
  const sectionCls =
    "rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4";

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={saving ? "Saving…" : plan ? "Save Changes" : "Create Plan"}
      cancelText="Cancel"
      confirmLoading={saving}
      title={
        <span className="text-base font-bold text-slate-900 dark:text-slate-100">
          {plan ? "Edit Subscription Plan" : "New Subscription Plan"}
        </span>
      }
      width={640}
      styles={{ body: { padding: "8px 0" } }}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4 py-2 max-h-[75vh] overflow-y-auto pr-1">

        {/* Name & Slug */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Plan Name *</label>
            <input
              className={inputCls}
              placeholder="e.g. Pro"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Slug *</label>
            <input
              className={inputCls}
              placeholder="e.g. pro"
              value={form.slug}
              onChange={(e) =>
                set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))
              }
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={inputCls}
            rows={2}
            placeholder="Short description of this plan"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Monthly Price (৳)</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.price_monthly}
              onChange={(e) => set("price_monthly", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelCls}>Yearly Price (৳)</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.price_yearly}
              onChange={(e) => set("price_yearly", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <input
              className={inputCls}
              placeholder="BDT"
              maxLength={3}
              value={form.currency ?? "BDT"}
              onChange={(e) => set("currency", e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Trial & Sort */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Trial Days</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.trial_days ?? 0}
              onChange={(e) => set("trial_days", parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelCls}>Sort Order</label>
            <input
              type="number"
              min={0}
              className={inputCls}
              value={form.sort_order ?? 0}
              onChange={(e) => set("sort_order", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Plan flags */}
        <div className="flex flex-wrap gap-5">
          {(
            [
              ["is_active", "Active"],
              ["is_featured", "Featured"],
              ["is_public", "Public"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700 dark:text-slate-300"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-violet-600"
                checked={!!form[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>

        {/* ── FEATURES ── */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={labelCls + " mb-0"}>Features</p>
              <p className="text-[11px] text-slate-400">
                Toggle each feature on or off for this plan
              </p>
            </div>
            <button
              type="button"
              onClick={() => addFeature(`feature_${featureItems.length + 1}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-semibold hover:bg-violet-100 transition"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {/* Quick-add preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_FEATURES.filter((p) => !featureItems.some((f) => f.key === p.key)).map(
              (p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => addFeature(p.key)}
                  className="px-2.5 py-0.5 rounded-full border border-dashed border-violet-300 dark:border-violet-500/40 text-violet-600 dark:text-violet-400 text-[11px] font-medium hover:bg-violet-50 dark:hover:bg-violet-500/10 transition"
                >
                  + {p.label}
                </button>
              )
            )}
          </div>

          {featureItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              No features added yet. Use the chips above or click Add.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {featureItems.map((f) => {
                const preset = PRESET_FEATURES.find((p) => p.key === f.key);
                return (
                  <div
                    key={f.key}
                    className="flex items-center gap-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-2"
                  >
                    {/* Feature name */}
                    <div className="flex-1 min-w-0">
                      {preset ? (
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {preset.label}
                          <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                            ({f.key})
                          </span>
                        </span>
                      ) : (
                        <input
                          className="w-full text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                          value={f.key}
                          onChange={(e) => updateFeatureKey(f.key, e.target.value)}
                          placeholder="feature_key"
                        />
                      )}
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-semibold ${
                          f.enabled
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400"
                        }`}
                      >
                        {f.enabled ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        size="small"
                        checked={f.enabled}
                        onChange={(v) => toggleFeature(f.key, v)}
                        style={f.enabled ? { backgroundColor: "#10b981" } : {}}
                      />
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeFeature(f.key)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── LIMITS ── */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={labelCls + " mb-0"}>Limits</p>
              <p className="text-[11px] text-slate-400">
                Set numeric limits. Check "Unlimited" to remove a cap.
              </p>
            </div>
            <button
              type="button"
              onClick={() => addLimit(`limit_${limitItems.length + 1}`)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-semibold hover:bg-violet-100 transition"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          {/* Quick-add preset chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_LIMITS.filter((p) => !limitItems.some((l) => l.key === p.key)).map(
              (p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => addLimit(p.key)}
                  className="px-2.5 py-0.5 rounded-full border border-dashed border-orange-300 dark:border-orange-500/40 text-orange-600 dark:text-orange-400 text-[11px] font-medium hover:bg-orange-50 dark:hover:bg-orange-500/10 transition"
                >
                  + {p.label}
                </button>
              )
            )}
          </div>

          {limitItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              No limits added yet. Use the chips above or click Add.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {limitItems.map((l) => {
                const preset = PRESET_LIMITS.find((p) => p.key === l.key);
                const isUnlimited = l.value === -1;
                return (
                  <div
                    key={l.key}
                    className="flex items-center gap-3 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-2"
                  >
                    {/* Limit name */}
                    <div className="flex-1 min-w-0">
                      {preset ? (
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {preset.label}
                          <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                            ({l.key})
                          </span>
                        </span>
                      ) : (
                        <input
                          className="w-full text-sm bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                          value={l.key}
                          onChange={(e) => updateLimitKey(l.key, e.target.value)}
                          placeholder="limit_key"
                        />
                      )}
                    </div>

                    {/* Value or unlimited */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isUnlimited ? (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 w-20 text-center">
                          ∞ Unlimited
                        </span>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          className="w-20 px-2 py-1 text-sm text-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                          value={l.value}
                          onChange={(e) =>
                            updateLimitValue(l.key, parseInt(e.target.value) || 1)
                          }
                        />
                      )}

                      {/* Unlimited toggle */}
                      <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 accent-emerald-600"
                          checked={isUnlimited}
                          onChange={(e) =>
                            updateLimitValue(l.key, e.target.checked ? -1 : 100)
                          }
                        />
                        Unlimited
                      </label>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeLimit(l.key)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}
