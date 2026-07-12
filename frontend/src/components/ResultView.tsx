"use client";

import { useState } from "react";
import clsx from "clsx";
import { CRM_FIELD_ORDER, ImportResult } from "@/types/crm";
import { DataTable, DataTableColumn } from "./DataTable";
import { StatCard } from "./StatCard";
import { StatusBadge } from "./StatusBadge";

const FIELD_LABELS: Record<string, string> = {
  created_at: "Created At",
  name: "Name",
  email: "Email",
  country_code: "Country Code",
  mobile_without_country_code: "Mobile",
  company: "Company",
  city: "City",
  state: "State",
  country: "Country",
  lead_owner: "Lead Owner",
  crm_status: "CRM Status",
  crm_note: "Note",
  data_source: "Data Source",
  possession_time: "Possession Time",
  description: "Description",
};

export function ResultView({ result }: { result: ImportResult }) {
  const [tab, setTab] = useState<"success" | "skipped">("success");

  const successColumns: DataTableColumn<ImportResult["success"][number]>[] = CRM_FIELD_ORDER.map((field) => ({
    key: field,
    header: FIELD_LABELS[field] ?? field,
    render: (row) => {
      const value = row[field];
      if (value == null || value === "") {
        return <span className="text-ink-subtle">—</span>;
      }
      if (field === "crm_status") {
        return <StatusBadge status={row.crm_status!} />;
      }
      if (field === "email") {
        return <span className="text-link">{value}</span>;
      }
      return value;
    },
  }));

  const skippedColumns: DataTableColumn<ImportResult["skipped"][number]>[] = [
    { key: "row", header: "Row #", render: (r) => r.row + 1, minWidth: 80 },
    { key: "reason", header: "Reason", render: (r) => r.reason, minWidth: 240 },
    {
      key: "raw",
      header: "Original Data",
      render: (r) => <span className="text-xs tracking-[0.32px] text-ink-muted">{JSON.stringify(r.raw)}</span>,
      minWidth: 320,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-px">
        <StatCard label="Total rows" value={result.totalRows} />
        <StatCard label="Successfully imported" value={result.totalImported} tone="success" />
        <StatCard label="Skipped" value={result.totalSkipped} tone="warning" />
      </div>

      {/* Carbon line tabs: hairline underline across, 2px primary underline on the selected tab */}
      <div className="flex border-b border-hairline">
        {(
          [
            { key: "success", label: `Imported (${result.totalImported})` },
            { key: "skipped", label: `Skipped (${result.totalSkipped})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={clsx(
              "-mb-px rounded-none border-b-2 px-5 py-3 text-sm transition-colors",
              tab === key
                ? "border-primary font-semibold text-ink dark:border-link"
                : "border-transparent text-ink-muted hover:border-surface-2 hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "success" ? (
        <DataTable
          columns={successColumns}
          rows={result.success}
          rowKey={(row, i) => row._row ?? i}
          emptyMessage="No records were successfully imported."
        />
      ) : (
        <DataTable
          columns={skippedColumns}
          rows={result.skipped}
          rowKey={(row) => row.row}
          emptyMessage="No records were skipped."
        />
      )}
    </div>
  );
}
