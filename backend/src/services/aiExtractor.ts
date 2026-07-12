import { AiBatchResponseSchema, ImportResult } from "../types/crm";
import { callGeminiForBatch, GeminiBatchInput } from "./geminiClient";
import { hasContactInfo, sanitizeAiRecord } from "../utils/validation";
import { mapWithConcurrency, withRetry } from "../utils/retry";

export const BATCH_SIZE = Number(process.env.AI_BATCH_SIZE ?? 20);
const BATCH_CONCURRENCY = Number(process.env.AI_BATCH_CONCURRENCY ?? 3);
// Used when the primary GEMINI_MODEL fails (e.g. 503 "high demand" or 429 quota
// exhaustion). Empty/unset disables the fallback. Only configure a model that has
// been verified against the extraction schema: several current models (e.g.
// gemini-3.5-flash, gemini-3.1-flash-lite) silently drop rows/fields or loop
// until MAX_TOKENS on this responseSchema, which is worse than failing honestly.
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? "";

// Capacity (503) and quota (429) errors don't recover within a retry window —
// retrying only burns time (and, for free-tier daily quotas, more quota).
// Fail over to the fallback model immediately; it has its own quota bucket.
function isCapacityError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.message.includes("503") || err.message.includes("429");
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export interface ExtractProgress {
  batchesTotal: number;
  batchesDone: number;
}

export async function extractCrmRecords(
  rows: Record<string, string>[],
  onProgress?: (progress: ExtractProgress) => void
): Promise<ImportResult> {
  const batches = chunk(rows, BATCH_SIZE);
  let batchesDone = 0;

  const batchResults = await mapWithConcurrency(batches, BATCH_CONCURRENCY, async (batch, batchIndex) => {
    const baseRow = batchIndex * BATCH_SIZE;
    const input: GeminiBatchInput[] = batch.map((data, i) => ({ _row: baseRow + i, data }));

    try {
      let raw: unknown;
      try {
        raw = await withRetry(() => callGeminiForBatch(input), {
          retries: 3,
          baseDelayMs: 800,
          shouldRetry: (err) => !isCapacityError(err),
        });
      } catch (err) {
        if (!FALLBACK_MODEL) throw err;
        console.warn(`Batch ${batchIndex}: primary model failed (${err instanceof Error ? err.message : err}); falling back to ${FALLBACK_MODEL}`);
        raw = await withRetry(() => callGeminiForBatch(input, FALLBACK_MODEL), { retries: 2, baseDelayMs: 800 });
      }
      const parsed = AiBatchResponseSchema.parse(raw);
      onProgress?.({ batchesTotal: batches.length, batchesDone: ++batchesDone });
      return { input, records: parsed.records };
    } catch (err) {
      onProgress?.({ batchesTotal: batches.length, batchesDone: ++batchesDone });
      // Whole batch failed after retries: mark every row in it as skipped
      // rather than failing the entire import.
      const reason = err instanceof Error ? err.message : "AI extraction failed";
      return {
        input,
        records: input.map((item) => ({ _row: item._row, _skipped: true, _skip_reason: `AI batch failed: ${reason}` })),
      };
    }
  });

  const success: ImportResult["success"] = [];
  const skipped: ImportResult["skipped"] = [];

  for (const { input, records } of batchResults) {
    const byRow = new Map(input.map((item) => [item._row, item.data]));
    const seenRows = new Set<number>();

    for (const record of records) {
      const rowIndex = record._row ?? -1;
      // Ignore rows the AI invented or echoed twice — only the first response
      // for each real input row counts, so totals always add up to totalRows.
      if (!byRow.has(rowIndex) || seenRows.has(rowIndex)) continue;
      seenRows.add(rowIndex);
      const rawData = byRow.get(rowIndex) ?? {};

      if (record._skipped) {
        skipped.push({ row: rowIndex, reason: record._skip_reason ?? "Skipped by AI", raw: rawData });
        continue;
      }

      const sanitized = sanitizeAiRecord(record as Record<string, unknown>);
      if (!hasContactInfo(sanitized)) {
        skipped.push({ row: rowIndex, reason: "No email or mobile number found", raw: rawData });
        continue;
      }

      success.push({ ...sanitized, _row: rowIndex });
    }

    // Backstop: any input row the AI never echoed back would otherwise vanish
    // from both lists. Surface it as skipped so the import always accounts for
    // every row (totalImported + totalSkipped === totalRows).
    for (const item of input) {
      if (!seenRows.has(item._row)) {
        skipped.push({ row: item._row, reason: "AI did not return this row", raw: item.data });
      }
    }
  }

  success.sort((a, b) => (a._row ?? 0) - (b._row ?? 0));
  skipped.sort((a, b) => a.row - b.row);

  return {
    success,
    skipped,
    totalRows: rows.length,
    totalImported: success.length,
    totalSkipped: skipped.length,
  };
}
