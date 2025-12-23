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
          name:
            typeof field.value === "string" ? field.value : field.value.name,
          status: "done",
          url: typeof field.value === "string" ? field.value : undefined, // preview for uploaded file
        },
      ]
    : [];

  const handleBeforeUpload = (file: File) => {
    const isValidSize = file.size / 1024 / 1024 <= 5; // 5 MB
    if (!isValidSize) {
      setError("File must be smaller than 5 MB!");
      return Upload.LIST_IGNORE; // prevent adding this file
    }
    setError(null);
    field.onChange(file); // save File object into RHF
    field.onBlur(); // ✅ trigger validation

    return false; // prevent auto-upload
  };

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onRemove={() => {
          field.onChange(undefined);
          field.onBlur();
          setError(null);
        }}
        beforeUpload={handleBeforeUpload}
      >
        {fileList.length >= 1 ? null : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>{label}</div>
          </div>
        )}
      </Upload>

      {error && (
        <Alert message={error} type="error" showIcon className="mt-2" />
      )}
    </>
  );
}
