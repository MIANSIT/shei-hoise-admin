"use client";

import { useEffect, useState } from "react";
import { Modal } from "antd";
import { viewStoreOwners } from "@/lib/queries/users/viewUser";
import { updateStore } from "@/lib/queries/onboarding/store/updateStore";
import { deleteStore } from "@/lib/queries/onboarding/store/deleteStore";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { UserWithRelationsType } from "@/lib/schema/user.types";
import { StoreStatus } from "@/lib/types/enums";
import { FilterType, StoreWithTrial } from "@/lib/types/store/storeOwner.types";
import { isActiveTrial } from "@/lib/types/store/trialUtils";
import { StoreOwnersHeader } from "@/app/component/store/viewStore/StoreOwnersHeader";
import { StoreOwnersToolbar } from "@/app/component/store/viewStore/StoreOwnersToolbar";
import { UserRow } from "@/app/component/store/viewStore/UserRow";

const isStoreActive = (val: unknown): boolean => val === true || val === "true";

export default function StoreOwnersPage() {
  const { success, error: notifyError } = useSheiNotification();
  const [users, setUsers] = useState<UserWithRelationsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteTarget, setDeleteTarget] = useState<StoreWithTrial | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const res = await viewStoreOwners();
      if (res.success && Array.isArray(res.data))
        setUsers(res.data as UserWithRelationsType[]);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleStatusChange = async (storeId: string, status: StoreStatus) => {
    await updateStore({ storeId, status });
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        stores: u.stores?.map((s) => (s.id === storeId ? { ...s, status } : s)),
      })),
    );
  };

  const handleActiveChange = async (storeId: string, isActive: boolean) => {
    await updateStore({ storeId, isActive });
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        stores: u.stores?.map((s) =>
          s.id === storeId ? { ...s, is_active: isActive } : s,
        ),
      })),
    );
  };

  const handleDeleteStore = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteStore(deleteTarget.id);
    if (res.success) {
      success(
        res.ownerDeleted
          ? "Store deleted along with the store admin's account"
          : "Store deleted",
      );
      setUsers((prev) =>
        res.ownerDeleted
          ? prev.filter((u) => u.id !== res.ownerId)
          : prev.map((u) => ({
              ...u,
              stores: u.stores?.filter((s) => s.id !== deleteTarget.id),
            })),
      );
    } else {
      notifyError("Failed to delete store");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const stores = (u.stores ?? []) as StoreWithTrial[];

    const matchesSearch =
      !q ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      stores.some(
        (s) =>
          s.store_name?.toLowerCase().includes(q) ||
          s.store_slug?.toLowerCase().includes(q),
      );

    const matchesFilter = (() => {
      switch (filter) {
        case "all":
          return true;
        case "active":
          return stores.some((s) => isStoreActive(s.is_active));
        case "inactive":
          return stores.some((s) => !isStoreActive(s.is_active));
        case "pending":
          return stores.some((s) => s.status === StoreStatus.PENDING);
        case "approved":
          return stores.some((s) => s.status === StoreStatus.APPROVED);
        case "rejected":
          return stores.some((s) => s.status === StoreStatus.REJECTED);
        case "trial":
          return stores.some((s) => isActiveTrial(s.status, s.created_at));
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
        <div className="max-w-[1100px] mx-auto px-6 py-10">
          <StoreOwnersHeader users={users} />
          <StoreOwnersToolbar
            search={search}
            filter={filter}
            resultCount={filtered.length}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
          />

          {/* Column headers */}
          <div className="flex items-center gap-4 px-6 py-2 text-[11px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2">
            <div className="w-11 shrink-0" />
            <div className="flex-[0_0_220px]">Owner</div>
            <div className="flex-[0_0_150px]">Phone</div>
            <div className="flex-[0_0_120px]">Country</div>
            <div className="flex-[0_0_90px]">Status</div>
            <div className="flex-1">Stores</div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-slate-200 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]"
                  style={{
                    animation: `pulse 1.5s ease infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08]">
              <div className="text-5xl mb-4 opacity-40">🏪</div>
              <div
                className="text-lg font-bold text-slate-500 dark:text-slate-400"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                No store owners found
              </div>
              <div className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Try adjusting your search or filter
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((user, i) => (
                <UserRow
                  key={user.id}
                  user={user}
                  index={i}
                  onStatusChange={handleStatusChange}
                  onActiveChange={handleActiveChange}
                  onDeleteStore={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onOk={handleDeleteStore}
        okText={deleting ? "Deleting…" : "Delete"}
        okButtonProps={{ danger: true, loading: deleting }}
        cancelText="Cancel"
        title="Delete Store"
        width={440}
      >
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Are you sure you want to delete{" "}
          <strong>{deleteTarget?.store_name}</strong>? This permanently
          removes the store, its settings, subscriptions, invoices, and
          uploaded files. If this is the owner&apos;s only store, their admin
          account and login credentials will be deleted too. This action
          cannot be undone.
        </p>
      </Modal>
    </>
  );
}
