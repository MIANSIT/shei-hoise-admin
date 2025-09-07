"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { StoreFormData } from "@/lib/utils/schemas/store/storeSchema";
import { ControlledPictureWall } from "@/app/component/common/PictureWall";
import type { Path } from "react-hook-form";

interface Props {
  control: Control<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreMediaFields({ control, errors }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Logo */}
      <Controller
        name="logo_url"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col">
            <span className="mb-2 font-semibold ">Logo</span>
            <div className="p-4 border border-dashed border-gray-300 rounded-lg flex justify-center items-center transition">
              <ControlledPictureWall<StoreFormData, Path<StoreFormData>>
                field={field}
                error={errors.logo_url?.message as string | undefined}
                label=""
              />
            </div>
            {errors.logo_url && (
              <span className="mt-1 text-sm text-red-500">
                {errors.logo_url.message}
              </span>
            )}
          </div>
        )}
      />

      {/* Banner */}
      <Controller
        name="banner_url"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col">
            <span className="mb-2 font-semibold ">Banner</span>
            <div className="p-4 border border-dashed border-gray-300 rounded-lg flex justify-center items-center transition">
              <ControlledPictureWall<StoreFormData, Path<StoreFormData>>
                field={field}
                error={errors.banner_url?.message as string | undefined}
                label=""
                multiple
              />
            </div>
            {errors.banner_url && (
              <span className="mt-1 text-sm text-red-500">
                {errors.banner_url.message}
              </span>
            )}
          </div>
        )}
      />
    </div>
  );
}
