"use client";

import { Upload, Button, Alert } from "antd";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { useState, useEffect } from "react";
import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";
import Link from "next/link";

interface UploadFileProps<T extends FieldValues> {
  field: ControllerRenderProps<T, Path<T>>;
  label: string;
}

export default function UploadFile<T extends FieldValues>({
  field,
  label,
}: UploadFileProps<T>) {
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>(label);

  useEffect(() => {
    if (!field.value) {
      setBlobUrl(null);
      setFileName(label);
    }
  }, [field.value, label]);

  const fileList: UploadFile[] = field.value
    ? [
        {
          uid: "-1",
          name: fileName,
          status: "done",
          url: blobUrl || field.value,
        },
      ]
    : [];

  const handleFileRead = (file: RcFile) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        const result = reader.result as string;

        // Convert base64 to Blob URL for preview
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

  const handleRemove = () => {
    field.onChange(undefined);
    setBlobUrl(null);
    setFileName(label);
    setError(null);
  };

  return (
    <>
      <Upload
        listType="text"
        fileList={fileList}
        onRemove={handleRemove}
        customRequest={async ({ file, onSuccess, onError }) => {
          try {
            const rcFile = file as RcFile; // ✅ cast here
            const url = await handleFileRead(rcFile);
            field.onChange(url);
            setBlobUrl(url);
            setFileName(rcFile.name); // ✅ now TypeScript knows .name exists
            setError(null);
            onSuccess?.({ url }, rcFile);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : "Upload failed";
            setError(errMsg);
            onError?.(new Error(errMsg));
          }
        }}
        showUploadList={{
          showPreviewIcon: false,
          showRemoveIcon: true,
          removeIcon: (
            <span style={{ color: "gray", cursor: "pointer" }}>❌</span>
          ),
        }}
      >
        {fileList.length >= 1 ? null : <Button>{label}</Button>}
      </Upload>

      {error && (
        <Alert type="error" message={error} showIcon className="mt-2" />
      )}
    </>
  );
}
