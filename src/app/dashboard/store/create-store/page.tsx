"use client";

import { useState } from "react";
import { message } from "antd";
import { createUserSchema, CreateUserType } from "@/lib/schema/user.schema";
import StoreCreateForm from "@/app/component/store/StoreCreateForm";
import { createUser } from "@/lib/queries/users/createUser"; // ✅ server action

export default function StoreCreatePage() {
  const [loading, setLoading] = useState(false);

  const handleCreateStore = async (values: CreateUserType) => {
    setLoading(true);
    try {
      const payload: CreateUserType = createUserSchema.parse(values);
      const result = await createUser(payload);
      message.success("Store owner created successfully!");
      console.log("Created User ID:", result.userId);
    } catch (err: unknown) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        message.error("Failed to create store owner");
      }
    } finally {
      setLoading(false);
    }
  };

  return <StoreCreateForm onSubmit={handleCreateStore} loading={loading} />;
}
