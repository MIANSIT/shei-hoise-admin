import React, { useState, useEffect, useRef } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Upload, Image, Form } from "antd";
import type { UploadFile, UploadProps } from "antd";
import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

type FileType = UploadFile & { preview?: string };

// Convert file to Base64
const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

interface ControlledPictureWallProps<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  error?: string;
  label: string;
  maxFiles?: number;
  multiple?: boolean;
  defaultFiles?: string[]; // already uploaded images
}

export function ControlledPictureWall<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>({
  field,
  error,
  label,
  maxFiles = 8,
  multiple = false,
  defaultFiles = [],
}: ControlledPictureWallProps<TFieldValues, TName>) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const fieldRef = useRef(field);
  const multipleRef = useRef(multiple);

  // Initialize file list from defaultFiles (for edit forms)
  useEffect(() => {
    if (defaultFiles.length) {
      const initialFiles: UploadFile[] = defaultFiles.map((url, index) => ({
        uid: `-default-${index}`,
        name: url.split("/").pop() || `image-${index}`,
        status: "done",
        url,
      }));
      setFileList(initialFiles);

      if (multipleRef.current) {
        fieldRef.current.onChange(
          defaultFiles as unknown as typeof field.value
        );
      } else {
        fieldRef.current.onChange(
          defaultFiles[0] as unknown as typeof field.value
        );
      }
    }
  }, [defaultFiles, field]);

  const handlePreview = async (file: FileType) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = async ({
    fileList: newFileList,
  }) => {
    setFileList(newFileList);

    if (multiple) {
      const base64List: string[] = await Promise.all(
        newFileList
          .filter((f) => f.originFileObj)
          .map((f) => getBase64(f.originFileObj as File))
      );

      const urls = newFileList
        .filter((f) => f.url && !f.originFileObj)
        .map((f) => f.url!) as string[];

      field.onChange([...urls, ...base64List] as typeof field.value);
    } else {
      if (newFileList[0]?.originFileObj) {
        const base64 = await getBase64(newFileList[0].originFileObj as File);
        field.onChange(base64 as typeof field.value);
      } else if (newFileList[0]?.url) {
        field.onChange(newFileList[0].url as typeof field.value);
      } else {
        field.onChange("" as typeof field.value);
      }
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>{label}</div>
    </div>
  );

  return (
    <Form.Item label={label} validateStatus={error ? "error" : ""} help={error}>
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={() => false}
        multiple={multiple}
      >
        {fileList.length >= maxFiles ? null : uploadButton}
      </Upload>

      {previewImage && (
        <Image
          alt="Preview"
          wrapperStyle={{ display: "none" }}
          preview={{
            visible: previewOpen,
            src: previewImage,
            onVisibleChange: (visible) => setPreviewOpen(visible),
          }}
        />
      )}
    </Form.Item>
  );
}
