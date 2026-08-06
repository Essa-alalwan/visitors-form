import { File as FileIcon, Image as ImageIcon, X } from "lucide-react";
import { formatFileSize } from "../../utils/formatFileSize";

export function FilePreviewItem({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const isImage = file.type.startsWith("image/");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {isImage ? (
          <ImageIcon className="h-4 w-4" />
        ) : (
          <FileIcon className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {file.name}
        </p>
        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
