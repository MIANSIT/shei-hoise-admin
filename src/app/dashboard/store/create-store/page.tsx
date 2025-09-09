"use client";
import { useState } from "react";
import { message } from "antd";
import { CreateUserInput, CreateUserType, createUserSchema } from "@/lib/schema/user.schema";
import StoreCreateForm from "@/app/component/store/StoreCreateForm";
import { createUser } from "@/lib/queries/users/createUser";

export default function StoreCreatePage() {
  const [loading, setLoading] = useState(false);

  const handleCreateStore = async (values: CreateUserInput) => {
    setLoading(true);
    try {
      // Validate and parse form data to match your backend schema
      const payload: CreateUserType = createUserSchema.parse(values);

      // Call the createUser API
      const result = await createUser(payload);

      message.success("Store owner created successfully!");
      console.log("Created User ID:", result.userId);
    } catch (err: unknown) {
      console.error(err);

      // Type-safe error handling
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
