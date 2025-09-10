import { Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

interface UploadImageProps<T extends FieldValues> {
  field: ControllerRenderProps<T, Path<T>>;
  label: string;
  notify: { error: (msg: string) => void };
}

export default function UploadImage<T extends FieldValues>({
  field,
  label,
  notify,
}: UploadImageProps<T>) {
  const fileList: UploadFile[] = field.value
    ? [{ uid: "-1", name: label, status: "done", url: field.value }]
    : [];

  return (
    <Upload
      listType="picture-card"
      fileList={fileList}
      onRemove={() => field.onChange(undefined)}
      customRequest={async ({ file, onSuccess, onError }) => {
        try {
          const reader = new FileReader();
          reader.readAsDataURL(file as RcFile);

          reader.onload = () => {
            const result = reader.result as string;
            field.onChange(result);
            if (onSuccess) onSuccess({ url: result }, file as RcFile);
          };

          reader.onerror = () => {
            const error = new Error("File reading failed");
            notify.error(error.message);
            if (onError) onError(error);
          };
        } catch (err) {
          const error = err instanceof Error ? err : new Error("Upload failed");
          notify.error(error.message);
          if (onError) onError(error);
        }
      }}
    >
      {fileList.length >= 1 ? null : (
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      )}
    </Upload>
  );
}
