"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  minWidth?: number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  maxHeight?: number;
  emptyMessage?: string;
}

const ROW_HEIGHT = 44;
const VIRTUALIZE_THRESHOLD = 100;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  maxHeight = 480,
  emptyMessage = "No rows to display.",
}: DataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = rows.length > VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    enabled: shouldVirtualize,
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-none border border-hairline bg-canvas p-10 text-center text-sm text-ink-muted">
        {emptyMessage}
      </div>
    );
  }

  const virtualItems = shouldVirtualize ? virtualizer.getVirtualItems() : null;
  const totalSize = shouldVirtualize ? virtualizer.getTotalSize() : rows.length * ROW_HEIGHT;
  const paddingTop = virtualItems && virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems && virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  const visibleRows: { row: T; index: number }[] = shouldVirtualize
    ? virtualItems!.map((vi) => ({ row: rows[vi.index], index: vi.index }))
    : rows.map((row, index) => ({ row, index }));

  return (
    <div
      ref={scrollRef}
      className="relative overflow-auto rounded-none border border-hairline bg-canvas"
      style={{ maxHeight }}
    >
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface-2 shadow-[0_1px_0_0_var(--hairline)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold tracking-[0.16px] text-ink"
                style={{ minWidth: col.minWidth ?? 140 }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr aria-hidden style={{ height: paddingTop }}>
              <td colSpan={columns.length} />
            </tr>
          )}
          {visibleRows.map(({ row, index }) => (
            <tr
              key={rowKey(row, index)}
              className="border-t border-hairline even:bg-surface-1 hover:bg-surface-2"
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-2.5 text-ink">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {paddingBottom > 0 && (
            <tr aria-hidden style={{ height: paddingBottom }}>
              <td colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
