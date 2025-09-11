"use client";

import { useState } from "react";
import { createUserSchema, CreateUserType } from "@/lib/schema/user.schema";
import StoreCreateForm from "@/app/component/store/StoreCreateForm";
import { createUser } from "@/lib/queries/users/createUser";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";

export default function StoreCreatePage() {
  const [loading, setLoading] = useState(false);
  const notify = useSheiNotification();

  // ✅ Handles API, notifications, and reset
  const handleCreateStore = async (
    values: CreateUserType,
    resetForm: () => void
  ) => {
    setLoading(true);
    try {
      const payload = createUserSchema.parse(values); // validate
      await createUser(payload);

      notify.success("Store owner created successfully!");
      resetForm(); // reset form only here
    } catch (err: unknown) {
      if (err instanceof Error) notify.error(err.message);
      else notify.error("Failed to create store owner");
    } finally {
      setLoading(false);
    }
  };

  return <StoreCreateForm onSubmit={handleCreateStore} loading={loading} />;
}
