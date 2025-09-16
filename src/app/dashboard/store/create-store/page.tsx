"use client";

import { useState } from "react";
import { createUserSchema, CreateUserType } from "@/lib/schema/user.schema";
import StoreCreateForm from "@/app/component/store/StoreCreateForm";
import { createUser } from "@/lib/queries/users/createUser";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";

export default function StoreCreatePage() {
  const [loading, setLoading] = useState(false);
  const notify = useSheiNotification();

  const handleCreateStore = async (
    values: CreateUserType,
    resetForm: () => void
  ) => {
    setLoading(true);
    try {
      // ✅ validate but don’t upload
      const payload = createUserSchema.parse(values);
      await createUser(payload);

      notify.success("Store owner created successfully!");
      resetForm();
    } catch (err: unknown) {
      if (err instanceof Error) notify.error(err.message);
      else notify.error("Failed to create store owner");
    } finally {
      setLoading(false);
    }
  };

  return <StoreCreateForm onSubmit={handleCreateStore} loading={loading} />;
}
