"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ImportProgress } from "@/lib/api";

const SEGMENT_COUNT = 10;
const SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, i) => i);

const STATUS_MESSAGES = [
  "Reading your columns…",
  "Matching fields to the CRM schema…",
  "Splitting phone numbers and country codes…",
  "Sorting extra emails into notes…",
  "Inferring lead statuses…",
  "Double-checking dates…",
];

export function ProcessingIndicator({ label, progress }: { label: string; progress: ImportProgress | null }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);

  const hasBatches = Boolean(progress && progress.batchesTotal > 0);
  const percent = hasBatches ? Math.round((progress!.batchesDone / progress!.batchesTotal) * 100) : 0;

  // Batches complete in concurrent bursts (see AI_BATCH_CONCURRENCY), so the real
  // percent jumps in steps with dead air between bursts. Trickle the displayed
  // percent continuously toward a ceiling just short of the next real jump, so the
  // bar is always in motion; a new progress event only ever raises the ceiling.
  const sliceWidth = hasBatches ? 100 / progress!.batchesTotal : 0;
  const trickleCeiling = hasBatches ? Math.min(percent + sliceWidth * 0.85, 99) : 0;

  useEffect(() => {
    if (!hasBatches) return;
    const timer = setInterval(() => {
      setDisplayPercent((current) => {
        const floor = Math.max(current, percent);
        if (floor >= trickleCeiling) return floor;
        return floor + (trickleCeiling - floor) * 0.06;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [hasBatches, percent, trickleCeiling]);

  // Before the first batch completes there's no real progress to key off, so cycle
  // messages on a clock. Once batches are landing, the narrative below is derived
  // straight from `percent` instead, so it never gets ahead of (or stuck behind)
  // what's actually done.
  useEffect(() => {
    if (hasBatches) return;
    const timer = setInterval(() => setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length), 2000);
    return () => clearInterval(timer);
  }, [hasBatches]);

  const shownPercent = hasBatches ? Math.round(Math.max(displayPercent, percent)) : 0;
  const shownMessageIndex = hasBatches
    ? Math.min(Math.floor((percent / 100) * STATUS_MESSAGES.length), STATUS_MESSAGES.length - 1)
    : messageIndex;

  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-none border border-hairline bg-canvas p-14 text-center">
      {/* Carbon loading spinner */}
      <svg viewBox="0 0 100 100" className="h-14 w-14 animate-spin [animation-duration:0.9s]">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-surface-2" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          strokeWidth="8"
          strokeDasharray="180 264"
          strokeLinecap="butt"
          className="stroke-primary dark:stroke-link"
        />
      </svg>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold">AI extraction in progress</p>
        <p key={shownMessageIndex} className="animate-[fadeUp_0.4s_ease-out] text-sm text-link" aria-live="polite">
          {STATUS_MESSAGES[shownMessageIndex]}
        </p>
        <p className="max-w-md text-sm text-ink-muted">{label}</p>
      </div>

      {hasBatches ? (
        <div className="flex w-72 max-w-full flex-col gap-2">
          <div className="flex gap-1">
            {SEGMENTS.map((i) => {
              const segmentStart = (i / SEGMENT_COUNT) * 100;
              const segmentEnd = ((i + 1) / SEGMENT_COUNT) * 100;
              const filled = shownPercent >= segmentEnd;
              const active = !filled && shownPercent > segmentStart;
              return (
                <span
                  key={i}
                  className={clsx(
                    "h-2 flex-1 transition-colors duration-300",
                    filled && "bg-primary dark:bg-link",
                    active && "animate-pulse bg-primary/50 dark:bg-link/50",
                    !filled && !active && "bg-surface-2"
                  )}
                />
              );
            })}
          </div>
          <div className="flex items-baseline justify-between text-xs tracking-[0.32px] text-ink-muted">
            <span>
              Batch {Math.min(progress!.batchesDone + 1, progress!.batchesTotal)} of {progress!.batchesTotal} ·{" "}
              {progress!.rowsProcessed.toLocaleString()} / {progress!.totalRows.toLocaleString()} rows
            </span>
            <span className="font-semibold text-ink">{shownPercent}%</span>
          </div>
        </div>
      ) : (
        <div className="flex w-72 max-w-full flex-col gap-2">
          <div className="h-1 w-full overflow-hidden bg-surface-2">
            <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] bg-primary dark:bg-link" />
          </div>
          <p className="text-xs tracking-[0.32px] text-ink-muted">Uploading and parsing…</p>
        </div>
      )}

      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
