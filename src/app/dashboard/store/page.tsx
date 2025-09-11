"use client";

import { useEffect, useState } from "react";
import { Typography } from "antd";
import UserTable from "@/app/component/store/view/UserTable";
import { viewStoreOwners } from "@/lib/queries/users/viewUser";
import { UserWithRelationsType } from "@/lib/schema/user.types";

const { Title } = Typography;

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
      <UserTable users={users} />
    </div>
  );
}
