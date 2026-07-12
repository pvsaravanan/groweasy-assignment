"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import clsx from "clsx";

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ onFileAccepted, disabled }: DropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        setError("Please upload a single .csv file.");
        return;
      }
      if (accepted.length > 0) {
        setError(null);
        onFileAccepted(accepted[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: false,
    accept: { "text/csv": [".csv"] },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-none border border-dashed p-12 text-center transition-colors sm:p-16",
          isDragActive
            ? "border-primary bg-surface-1"
            : "border-ink-subtle bg-canvas hover:border-primary hover:bg-surface-1",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={clsx("h-8 w-8", isDragActive ? "text-link" : "text-ink-muted")}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <div className="flex flex-col gap-1">
          <p className="text-base">{isDragActive ? "Drop it here" : "Drag and drop your CSV file"}</p>
          <p className="text-sm text-ink-muted">
            or <span className="text-link">browse</span> to choose a file
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["Facebook Leads", "Google Ads", "CRM Exports", "Spreadsheets"].map((label) => (
            <span
              key={label}
              className="rounded-none border border-hairline bg-surface-1 px-2.5 py-1 text-xs tracking-[0.32px] text-ink-muted"
            >
              {label}
            </span>
          ))}
        </div>
        <p className="text-xs tracking-[0.32px] text-ink-subtle">
          Any column names, any layout — the AI figures out the mapping.
        </p>
      </div>
      {error && (
        <p className="mt-3 border-l-[3px] border-error bg-surface-1 px-4 py-3 text-sm text-ink">{error}</p>
      )}
    </div>
  );
}
