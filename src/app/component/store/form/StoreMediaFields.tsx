"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { StoreFormData } from "@/lib/utils/schemas/storeCreate/storeSchema";
import { Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

interface Props {
  control: Control<StoreFormData>;
  errors: FieldErrors<StoreFormData>;
}

export function StoreMediaFields({ control, errors }: Props) {
  const fileToUrl = (file: UploadFile) => {
    if (file.url) return file.url;
    if (file.originFileObj) return URL.createObjectURL(file.originFileObj as File);
    return "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Logo */}
      <Controller
        name="logo_url"
        control={control}
        render={({ field }) => (
          <div className="flex flex-col">
            <span className="mb-2 font-semibold">Logo</span>
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={1}
              onChange={({ fileList }) => {
                field.onChange(fileList.length ? fileToUrl(fileList[0]) : "");
              }}
            >
              <div>Upload Logo</div>
            </Upload>
            {errors.logo_url && (
              <span className="mt-1 text-sm text-red-500">{errors.logo_url.message}</span>
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
            <span className="mb-2 font-semibold">Banner</span>
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              multiple
              onChange={({ fileList }) => {
                const urls = fileList.map(fileToUrl);
                field.onChange(urls.length === 1 ? urls[0] : urls);
              }}
            >
              <div>Upload Banner</div>
            </Upload>
            {errors.banner_url && (
              <span className="mt-1 text-sm text-red-500">{errors.banner_url.message}</span>
            )}
          </div>
        )}
      />
    </div>
  );
}
