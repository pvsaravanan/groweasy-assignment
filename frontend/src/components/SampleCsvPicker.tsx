"use client";

import { useState } from "react";

const SAMPLES = [
  {
    file: "facebook_leads_export.csv",
    label: "Facebook Leads",
    description: "Ad name → data source, one blank row",
  },
  {
    file: "google_ads_export.csv",
    label: "Google Ads",
    description: "DD/MM dates, one contactless row",
  },
  {
    file: "manual_spreadsheet.csv",
    label: "Manual Spreadsheet",
    description: "Ambiguous headers, status from notes",
  },
  {
    file: "marketing_agency_export.csv",
    label: "Agency Export",
    description: "Free-text status/source values",
  },
  {
    file: "excel_sheet_export.csv",
    label: "Excel Sheet",
    description: "Multiple emails/phones in one cell",
  },
  {
    file: "crm_native_export.csv",
    label: "CRM Native Export",
    description: "Headers already match the schema",
  },
] as const;

interface SampleCsvPickerProps {
  onFileLoaded: (file: File) => void;
  disabled?: boolean;
}

export function SampleCsvPicker({ onFileLoaded, disabled }: SampleCsvPickerProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(sampleFile: string) {
    setError(null);
    setLoading(sampleFile);
    try {
      const res = await fetch(`/samples/${sampleFile}`);
      if (!res.ok) throw new Error(`Could not load sample (${res.status})`);
      const blob = await res.blob();
      onFileLoaded(new File([blob], sampleFile, { type: "text/csv" }));
    } catch {
      setError("Could not load the sample file. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs tracking-[0.32px] text-ink-muted">
        No CSV handy? Try one of these — each shaped like a different real-world export:
      </p>
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.file}
            type="button"
            disabled={disabled || loading !== null}
            onClick={() => handlePick(sample.file)}
            title={sample.description}
            className="flex flex-col gap-0.5 rounded-none border border-hairline bg-canvas px-3 py-2 text-left transition-colors hover:border-primary hover:bg-surface-1 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-link"
          >
            <span className="text-xs font-semibold text-ink">
              {loading === sample.file ? "Loading…" : sample.label}
            </span>
            <span className="text-xs text-ink-muted">{sample.description}</span>
          </button>
        ))}
      </div>
      {error && <p className="border-l-[3px] border-error bg-surface-1 px-4 py-3 text-sm text-ink">{error}</p>}
    </div>
  );
}
