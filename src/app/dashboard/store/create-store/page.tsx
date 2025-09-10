"use client";

import { useState } from "react";
import { createUserSchema, CreateUserType } from "@/lib/schema/user.schema";
import StoreCreateForm from "@/app/component/store/StoreCreateForm";
import { createUser } from "@/lib/queries/users/createUser"; // ✅ server action
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";

export default function StoreCreatePage() {
  const [loading, setLoading] = useState(false);
  const notify = useSheiNotification(); // ✅ use custom notification

  const handleCreateStore = async (values: CreateUserType) => {
    setLoading(true);
    try {
      const payload: CreateUserType = createUserSchema.parse(values);
      const result = await createUser(payload);

      notify.success("Store owner created successfully!"); // ✅ replaced AntD message
      console.log("Created User ID:", result.userId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        notify.error(err.message); // ✅ replaced AntD message
      } else {
        notify.error("Failed to create store owner");
      }
    } finally {
      setLoading(false);
    }
  };

  return <StoreCreateForm onSubmit={handleCreateStore} loading={loading} />;
}
