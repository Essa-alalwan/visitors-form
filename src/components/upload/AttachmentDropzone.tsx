import { useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { UploadCloud } from "lucide-react";
import clsx from "clsx";
import { FieldError } from "../feedback/FieldError";
import { FilePreviewItem } from "./FilePreviewItem";
import { getFieldError } from "../../utils/getFieldError";
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_MB,
} from "../../utils/constants";

export function AttachmentDropzone({
  name,
  label = "Attachment File",
  required = true,
}: {
  name: string;
  label?: string;
  required?: boolean;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = getFieldError(errors, name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-primary-600">*</span>}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const file: File | undefined = field.value;

          function handleFiles(fileList: FileList | null) {
            const picked = fileList?.[0];
            if (picked) field.onChange(picked);
          }

          if (file) {
            return (
              <div id={name}>
                <FilePreviewItem
                  file={file}
                  onRemove={() => field.onChange(undefined)}
                />
              </div>
            );
          }

          return (
            <div
              id={name}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={clsx(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                isDragOver
                  ? "border-primary-500 bg-primary-50"
                  : error
                    ? "border-red-300 bg-red-50/40"
                    : "border-slate-300 bg-white hover:border-primary-400 hover:bg-primary-50/40",
              )}
            >
              <UploadCloud className="h-6 w-6 text-primary-500" />
              <p className="text-sm font-medium text-slate-700">
                Drag &amp; drop a file, or{" "}
                <span className="text-primary-700 underline">browse</span>
              </p>
              <p className="text-xs text-slate-400">
                PDF, JPG or PNG, up to {MAX_FILE_SIZE_MB}MB
              </p>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          );
        }}
      />
      <FieldError message={error} />
    </div>
  );
}
