"use client";

import { useState, useEffect } from "react";
import { Upload, Alert } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Update blob URL if field.value changes (e.g., reset)
  useEffect(() => {
    if (!field.value) {
      setBlobUrl(null);
    }
  }, [field.value]);

  const fileList: UploadFile[] = field.value
    ? [
        {
          uid: "-1",
          name: label,
          status: "done",
          url: blobUrl || field.value, // use blob URL for preview
        },
      ]
    : [];

  const handleFileRead = (file: RcFile) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const result = reader.result as string;

        // Convert base64 to Blob URL
        const byteString = atob(result.split(",")[1]);
        const mimeString = result.split(",")[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      reader.onerror = () => reject(new Error("File reading failed"));
    });
  };

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onRemove={() => {
          field.onChange(undefined);
          setBlobUrl(null);
          setError(null);
        }}
        customRequest={async ({ file, onSuccess, onError }) => {
          try {
            const rcFile = file as RcFile;
            const url = await handleFileRead(rcFile);
            field.onChange(url); // save blob URL for preview
            setBlobUrl(url);
            setError(null);
            onSuccess?.({ url }, rcFile);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Upload failed";
            setError(errMsg);
            onError?.(new Error(errMsg));
          }
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
