"use client";

import { useMemo, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { SampleCsvPicker } from "@/components/SampleCsvPicker";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { StepIndicator } from "@/components/StepIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProcessingIndicator } from "@/components/ProcessingIndicator";
import { ResultView } from "@/components/ResultView";
import { parseCsvFile, ParsedCsv } from "@/lib/csv";
import { importCsv, ImportApiError, ImportProgress } from "@/lib/api";
import { ImportResult } from "@/types/crm";

type Phase = "upload" | "preview" | "processing" | "result";

// Carbon button spec: 0px radius, 12px/16px padding, 14px weight-400 label
const BUTTON_PRIMARY =
  "rounded-none bg-primary px-4 py-3 text-sm text-white transition-colors hover:bg-primary-hover active:bg-primary-active";
const BUTTON_SECONDARY =
  "rounded-none bg-btn-secondary px-4 py-3 text-sm text-white transition-colors hover:bg-btn-secondary-hover active:bg-btn-secondary-active";
const BUTTON_TERTIARY =
  "rounded-none border border-primary bg-canvas px-4 py-3 text-sm text-link transition-colors hover:bg-primary hover:text-white dark:border-link dark:hover:bg-link dark:hover:text-ink";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const previewColumns: DataTableColumn<Record<string, string>>[] = useMemo(
    () =>
      (parsedCsv?.headers ?? []).map((header) => ({
        key: header,
        header,
        render: (row) => row[header] || <span className="text-ink-subtle">—</span>,
      })),
    [parsedCsv]
  );

  async function handleFileAccepted(newFile: File) {
    setParseError(null);
    setFile(newFile);
    try {
      const parsed = await parseCsvFile(newFile);
      setParsedCsv(parsed);
      setPhase("preview");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Could not parse this CSV file.");
      setFile(null);
    }
  }

  async function handleConfirm() {
    if (!file) return;
    setPhase("processing");
    setImportError(null);
    setProgress(null);
    try {
      const res = await importCsv(file, setProgress);
      setResult(res);
      setPhase("result");
    } catch (err) {
      const message = err instanceof ImportApiError ? err.message : "Something went wrong during import.";
      setImportError(message);
    }
  }

  function handleReset() {
    setPhase("upload");
    setFile(null);
    setParsedCsv(null);
    setParseError(null);
    setImportError(null);
    setResult(null);
    setProgress(null);
  }

  const stepForIndicator = phase === "upload" ? 1 : phase === "preview" ? 2 : phase === "processing" ? 3 : 4;

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      {/* Top nav — sticky white bar, 56px, 1px bottom hairline */}
      <header className="sticky top-0 z-20 border-b border-hairline bg-canvas">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-semibold tracking-[0.16px]">GrowEasy</span>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden text-xs tracking-[0.32px] text-ink-subtle sm:block">AI-powered lead import</p>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <StepIndicator current={stepForIndicator} />

        {phase === "upload" && (
          <section className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 sm:mt-4">
              <h2 className="max-w-3xl text-4xl font-light leading-[1.2] sm:text-[42px]">
                Import leads from <span className="text-link">any CSV</span>
              </h2>
              <p className="max-w-xl text-sm tracking-[0.16px] text-ink-muted">
                Any export, any columns — AI maps it to your CRM in seconds.
              </p>
            </div>
            <Dropzone onFileAccepted={handleFileAccepted} />
            {parseError && (
              <p className="border-l-[3px] border-error bg-surface-1 px-4 py-3 text-sm text-ink">{parseError}</p>
            )}
            <SampleCsvPicker onFileLoaded={handleFileAccepted} />
          </section>
        )}

        {phase === "preview" && parsedCsv && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-canvas p-4">
              <div>
                <p className="text-sm font-semibold">{file?.name}</p>
                <p className="text-xs tracking-[0.32px] text-ink-muted">
                  {parsedCsv.totalRows.toLocaleString()} row{parsedCsv.totalRows === 1 ? "" : "s"} ·{" "}
                  {parsedCsv.headers.length} columns · no AI processing yet
                </p>
                {parsedCsv.truncated && (
                  <p className="text-xs tracking-[0.32px] text-ink-subtle">
                    Showing first {parsedCsv.rows.length.toLocaleString()} rows in this preview — the full file will
                    be imported.
                  </p>
                )}
              </div>
              <div className="flex gap-px">
                <button type="button" onClick={handleReset} className={BUTTON_TERTIARY}>
                  Choose a different file
                </button>
                <button type="button" onClick={handleConfirm} className={BUTTON_PRIMARY}>
                  Confirm import
                </button>
              </div>
            </div>
            <DataTable
              columns={previewColumns}
              rows={parsedCsv.rows}
              rowKey={(_row, i) => i}
              emptyMessage="No rows found in this CSV."
            />
          </section>
        )}

        {phase === "processing" && !importError && (
          <ProcessingIndicator
            label="Analyzing rows and mapping them to GrowEasy CRM fields… this can take a moment for larger files."
            progress={progress}
          />
        )}

        {phase === "processing" && importError && (
          <div className="flex flex-col gap-4 border border-hairline border-l-[3px] border-l-error bg-canvas p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">Import failed</p>
              <p className="max-w-xl text-sm text-ink-muted">{importError}</p>
            </div>
            <div className="flex gap-px">
              <button type="button" onClick={handleReset} className={BUTTON_SECONDARY}>
                Start over
              </button>
              <button type="button" onClick={handleConfirm} className={BUTTON_PRIMARY}>
                Retry
              </button>
            </div>
          </div>
        )}

        {phase === "result" && result && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-success">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm font-semibold">Import complete</p>
              </div>
              <button type="button" onClick={handleReset} className={BUTTON_TERTIARY}>
                Import another file
              </button>
            </div>
            <ResultView result={result} />
          </section>
        )}
      </main>

      {/* Footer — the only inverted surface */}
      <footer className="border-t-2 border-primary bg-inverse-canvas px-4 py-10 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="flex max-w-sm flex-col gap-2">
              <p className="text-sm font-semibold text-inverse-ink">GrowEasy</p>
              <p className="text-sm text-inverse-ink-muted">Any CSV in. Clean leads out.</p>
            </div>
            <div className="flex gap-12">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-[0.32px] text-inverse-ink-muted uppercase">Pipeline</p>
                <p className="text-sm text-inverse-ink-muted">Parse</p>
                <p className="text-sm text-inverse-ink-muted">Map with AI</p>
                <p className="text-sm text-inverse-ink-muted">Validate</p>
                <p className="text-sm text-inverse-ink-muted">Import</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-[0.32px] text-inverse-ink-muted uppercase">Built with</p>
                <p className="text-sm text-inverse-ink-muted">Gemini</p>
                <p className="text-sm text-inverse-ink-muted">Next.js</p>
                <p className="text-sm text-inverse-ink-muted">Express</p>
              </div>
            </div>
          </div>
          <p className="border-t border-inverse-surface-1 pt-6 text-xs tracking-[0.32px] text-inverse-ink-muted">
            © {new Date().getFullYear()} GrowEasy CRM — every column is validated server-side before it reaches your
            leads.
          </p>
        </div>
      </footer>
    </div>
  );
}
