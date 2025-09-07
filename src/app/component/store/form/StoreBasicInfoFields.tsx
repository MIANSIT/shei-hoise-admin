"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Form, Input, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import { StoreFormData } from "@/lib/utils/schemas/storeCreate/storeSchema";

interface Props {
  control: Control<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreBasicInfoFields({ control, errors }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Owner ID */}

      {/* Store Name */}
      <Controller
        name="store_name"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Store Name"
            validateStatus={errors.store_name ? "error" : ""}
            help={errors.store_name?.message}
          >
            <Input {...field} placeholder="Enter Store Name" />
          </Form.Item>
        )}
      />

      {/* Store Slug */}
      <Controller
        name="store_slug"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Store Slug"
            validateStatus={errors.store_slug ? "error" : ""}
            help={errors.store_slug?.message}
          >
            <Input {...field} placeholder="Enter unique store slug" />
          </Form.Item>
        )}
      />

      {/* Status */}
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Form.Item label="Status">
            <Select {...field} onChange={(v) => field.onChange(v)}>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="suspended">Suspended</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
          </Form.Item>
        )}
      />

      {/* Approved By */}
      <Controller
        name="approved_by"
        control={control}
        render={({ field }) => (
          <Form.Item
            label="Approved By (Admin ID)"
            validateStatus={errors.approved_by ? "error" : ""}
            help={errors.approved_by?.message}
          >
            <Input {...field} placeholder="Optional admin UUID" />
          </Form.Item>
        )}
      />

      {/* Approved At */}
      <Controller
        name="approved_at"
        control={control}
        render={({ field }) => (
          <Form.Item label="Approved At">
            <DatePicker
              showTime
              className="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              value={field.value ? dayjs(field.value) : undefined}
              onChange={(date) =>
                field.onChange(date ? date.toISOString() : "")
              }
            />
          </Form.Item>
        )}
      />
    </div>
  );
}
