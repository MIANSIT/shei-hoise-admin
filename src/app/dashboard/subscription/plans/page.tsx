"use client";

import { useEffect, useState } from "react";
import { Modal } from "antd";
import { Plus, Pencil, Trash2, LayoutList, Star, Globe, EyeOff } from "lucide-react";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getSubscriptionPlans } from "@/lib/queries/subscription/plans/getPlans";
import { createSubscriptionPlan } from "@/lib/queries/subscription/plans/createPlan";
import { updateSubscriptionPlan } from "@/lib/queries/subscription/plans/updatePlan";
import { deleteSubscriptionPlan } from "@/lib/queries/subscription/plans/deletePlan";
import { PlanFormModal } from "@/app/component/subscription/plans/PlanFormModal";
import {
  SubscriptionPlan,
  CreatePlanInput,
} from "@/lib/types/subscription.types";

function PriceBadge({ amount, label }: { amount: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
        ৳{amount.toLocaleString()}
      </div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FlagBadge({ active, label }: { active: boolean; label: string }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400">
      {label}
    </span>
  );
}

function FeaturesList({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0)
    return <span className="text-slate-400 text-xs">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            v
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-700 text-slate-400 line-through"
          }`}
        >
          {k.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
}

function LimitsList({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0)
    return <span className="text-slate-400 text-xs">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300"
        >
          {k.replace(/_/g, " ")}: {v === -1 ? "∞" : String(v)}
        </span>
      ))}
    </div>
  );
}

export default function SubscriptionPlansPage() {
  const { success, error: notifyError } = useSheiNotification();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const res = await getSubscriptionPlans();
    if (res.success) setPlans(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (input: CreatePlanInput, id?: string) => {
    if (id) {
      const res = await updateSubscriptionPlan(id, input);
      if (res.success) {
        success("Plan updated successfully");
        setPlans((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...input } : p))
        );
        setModalOpen(false);
        setEditing(null);
      } else {
        notifyError("Failed to update plan");
      }
    } else {
      const res = await createSubscriptionPlan(input);
      if (res.success) {
        success("Plan created successfully");
        await fetchPlans();
        setModalOpen(false);
      } else {
        notifyError("Failed to create plan");
      }
    }
  };

  const handleToggle = async (
    plan: SubscriptionPlan,
    key: "is_active" | "is_featured" | "is_public"
  ) => {
    const val = !plan[key];
    const res = await updateSubscriptionPlan(plan.id, { [key]: val });
    if (res.success) {
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, [key]: val } : p))
      );
    } else {
      notifyError("Failed to update plan");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const res = await deleteSubscriptionPlan(deleteConfirm);
    if (res.success) {
      success("Plan deleted");
      setPlans((prev) => prev.filter((p) => p.id !== deleteConfirm));
    } else {
      notifyError("Failed to delete plan");
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  const filtered = plans.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity:0;transform:translateY(-8px); } to { opacity:1;transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-[960px] mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LayoutList className="w-5 h-5 text-violet-600" />
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Subscription Plans
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage pricing plans available to store owners
              </p>
            </div>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow transition"
            >
              <Plus className="w-4 h-4" />
              New Plan
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Plans", value: plans.length, color: "text-slate-700 dark:text-slate-200" },
              { label: "Active", value: plans.filter((p) => p.is_active).length, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Public", value: plans.filter((p) => p.is_public).length, color: "text-blue-600 dark:text-blue-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-5 py-4"
              >
                <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input
            className="w-full mb-5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
            placeholder="Search plans by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Plan List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-slate-200 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]"
                  style={{ animation: `pulse 1.5s ease infinite`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08]">
              <div className="text-5xl mb-4 opacity-40">📦</div>
              <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                {search ? "No plans match your search" : "No subscription plans yet"}
              </div>
              <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {!search && 'Click “New Plan” to create one'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3" style={{ animation: "slideDown 0.2s ease" }}>
              {filtered.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-6 py-5 hover:border-slate-300 dark:hover:border-white/[0.14] transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Left: name + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {plan.name}
                        </span>
                        <span className="text-xs text-slate-400 font-mono bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">
                          {plan.slug}
                        </span>
                        <FlagBadge active={plan.is_featured} label="⭐ Featured" />
                        <FlagBadge active={!plan.is_public} label="🔒 Private" />
                      </div>

                      {plan.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-1">
                          {plan.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {plan.trial_days > 0 && (
                          <span>Trial: <strong className="text-slate-700 dark:text-slate-300">{plan.trial_days}d</strong></span>
                        )}
                        <span>Sort: <strong className="text-slate-700 dark:text-slate-300">{plan.sort_order}</strong></span>
                        <span>Currency: <strong className="text-slate-700 dark:text-slate-300">{plan.currency}</strong></span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-14 shrink-0">Features</span>
                          <FeaturesList data={plan.features} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-14 shrink-0">Limits</span>
                          <LimitsList data={plan.limits} />
                        </div>
                      </div>
                    </div>

                    {/* Center: pricing */}
                    <div className="flex items-center gap-6 shrink-0 border-l border-r border-slate-100 dark:border-white/[0.06] px-6">
                      <PriceBadge amount={plan.price_monthly} label="/ mo" />
                      <PriceBadge amount={plan.price_yearly} label="/ yr" />
                    </div>

                    {/* Right: toggles + actions */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggle(plan, "is_active")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                          plan.is_active
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${plan.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {plan.is_active ? "Active" : "Inactive"}
                      </button>

                      {/* Toggle badges */}
                      <div className="flex gap-2">
                        <button
                          title={plan.is_featured ? "Remove featured" : "Mark as featured"}
                          onClick={() => handleToggle(plan, "is_featured")}
                          className={`p-1.5 rounded-lg transition ${
                            plan.is_featured
                              ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                              : "text-slate-300 dark:text-slate-600 hover:text-yellow-500"
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title={plan.is_public ? "Make private" : "Make public"}
                          onClick={() => handleToggle(plan, "is_public")}
                          className={`p-1.5 rounded-lg transition ${
                            plan.is_public
                              ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10"
                              : "text-slate-300 dark:text-slate-600 hover:text-blue-500"
                          }`}
                        >
                          {plan.is_public ? <Globe className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setEditing(plan); setModalOpen(true); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-violet-50 dark:hover:bg-violet-500/10 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 text-xs font-medium transition"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(plan.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 text-xs font-medium transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <PlanFormModal
        open={modalOpen}
        plan={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onOk={handleDelete}
        okText={deleting ? "Deleting…" : "Delete"}
        okButtonProps={{ danger: true, loading: deleting }}
        cancelText="Cancel"
        title="Delete Subscription Plan"
        width={400}
      >
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Are you sure you want to delete this plan? This action cannot be undone.
          Stores with an active subscription to this plan will be affected.
        </p>
      </Modal>
    </>
  );
}
