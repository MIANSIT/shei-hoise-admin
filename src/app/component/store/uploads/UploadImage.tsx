"use client";

import { useState } from "react";
import { Upload, Alert } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

interface UploadImageProps<T extends FieldValues> {
  field: ControllerRenderProps<T, Path<T>>;
  label: string;
}

export default function UploadImage<T extends FieldValues>({
  field,
  label,
}: UploadImageProps<T>) {
  const [error, setError] = useState<string | null>(null);

  const fileList: UploadFile[] = field.value
    ? [
        {
          uid: "-1",
          name: typeof field.value === "string" ? field.value : field.value.name,
          status: "done",
          url: typeof field.value === "string" ? field.value : undefined, // preview for uploaded file
        },
      ]
    : [];

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onRemove={() => {
          field.onChange(undefined);
          setError(null);
        }}
        beforeUpload={(file) => {
          field.onChange(file); // ✅ save File object into RHF
          return false; // ❌ prevent auto-upload
        }}
      >
        {fileList.length >= 1 ? null : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>{label}</div>
          </div>
        )}
      </Upload>

      {error && <Alert message={error} type="error" showIcon className="mt-2" />}
    </>
  );
}
