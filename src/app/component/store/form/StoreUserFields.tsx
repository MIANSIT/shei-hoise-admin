"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Form, Input } from "antd";
import { StoreFormData } from "@/lib/utils/schemas/storeCreate/storeSchema";

interface Props {
  control: Control<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreUserFields({ control, errors }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* User Email */}

      {/* First Name */}
      <Controller
        name="first_name"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="First Name"
            validateStatus={errors.first_name ? "error" : ""}
            help={errors.first_name?.message}
          >
            <Input {...field} placeholder="Enter first name" />
          </Form.Item>
        )}
      />

      {/* Last Name */}
      <Controller
        name="last_name"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Last Name"
            validateStatus={errors.last_name ? "error" : ""}
            help={errors.last_name?.message}
          >
            <Input {...field} placeholder="Enter last name" />
          </Form.Item>
        )}
      />

      {/* Phone Number */}
      <Controller
        name="user_phone"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Phone Number"
            validateStatus={errors.user_phone ? "error" : ""}
            help={errors.user_phone?.message}
          >
            <Input {...field} placeholder="+8801XXXXXXXXX" />
          </Form.Item>
        )}
      />
      <Controller
        name="user_email"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="User Email"
            validateStatus={errors.user_email ? "error" : ""}
            help={errors.user_email?.message}
          >
            <Input type="email" {...field} placeholder="user@example.com" />
          </Form.Item>
        )}
      />

      {/* Password */}
      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Password"
            validateStatus={errors.password ? "error" : ""}
            help={errors.password?.message}
          >
            <Input.Password {...field} placeholder="Enter password" />
          </Form.Item>
        )}
      />
    </div>
  );
}
