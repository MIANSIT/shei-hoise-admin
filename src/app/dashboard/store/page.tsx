"use client";

import { useEffect, useState } from "react";
import UserTable from "@/app/component/store/view/UserTable";
import { viewStoreOwners } from "@/lib/queries/users/viewUser";
import { UserWithRelationsType } from "@/lib/schema/user.types";

export default function StoreOwnersPage() {
  const [users, setUsers] = useState<UserWithRelationsType[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen">
      <UserTable users={users} loading={loading} /> {/* ✅ pass loading */}
    </div>
  );
}
