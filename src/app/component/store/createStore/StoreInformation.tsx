"use client";

import { Input, Switch } from "antd";
import { Controller, Control } from "react-hook-form";
import { CreateUserType } from "@/lib/schema/user.schema";
import UploadImage from "../uploads/UploadImage";
import { FormItemWrapper } from "./FormItemWrapper";

interface Props {
  control: Control<CreateUserType>;
}

export default function StoreInformation({ control }: Props) {
  return (
    <>
      <h3 className="text-xl font-semibold mb-4">Store Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Store Name */}
        <Controller
          name="store.store_name"
          control={control}
          render={({ field, fieldState }) => (
            <FormItemWrapper
              label="Store Name"
              required
              error={fieldState.error?.message}
            >
              <Input {...field} />
            </FormItemWrapper>
          )}
        />

        {/* Store Slug */}
        <Controller
          name="store.store_slug"
          control={control}
          render={({ field, fieldState }) => (
            <FormItemWrapper
              label="Store Slug"
              required
              error={fieldState.error?.message}
            >
              <Input {...field} />
            </FormItemWrapper>
          )}
        />

        {/* Description */}
        <Controller
          name="store.description"
          control={control}
          render={({ field, fieldState }) => (
            <FormItemWrapper
              label="Description"
              error={fieldState.error?.message}
              className="md:col-span-2"
            >
              <Input.TextArea {...field} rows={4} />
            </FormItemWrapper>
          )}
        />

        {/* Logo */}
        <Controller
          name="store.logo_url"
          control={control}
          render={({ field, fieldState }) => (
            <FormItemWrapper
              label="Logo"
              required
              error={fieldState.error?.message}
            >
              <UploadImage field={field} label="Logo" />
            </FormItemWrapper>
          )}
        />

        {/* Banner */}
        <Controller
          name="store.banner_url"
          control={control}
          render={({ field, fieldState }) => (
            <FormItemWrapper
              label="Banner"
              required
              error={fieldState.error?.message}
            >
              <UploadImage field={field} label="Banner" />
            </FormItemWrapper>
          )}
        />

        {/* Is Active */}
        <Controller
          name="is_active"
          control={control}
          render={({ field, fieldState }) => (
            <FormItemWrapper
              label="Is Active"
              error={fieldState.error?.message}
            >
              <Switch checked={field.value ?? true} onChange={field.onChange} />
            </FormItemWrapper>
          )}
        />
      </div>
    </>
  );
}
