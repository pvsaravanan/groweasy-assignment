import { afterEach, describe, expect, it, vi } from "vitest";
import { importCsv, ImportApiError } from "@/lib/api";

function ndjsonResponse(lines: string[], init: { ok?: boolean; status?: number } = {}): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(`${line}\n`));
      }
      controller.close();
    },
  });
  return new Response(body, { status: init.status ?? 200 });
}

function makeFile(): File {
  return new File(["Name,Email\nJane,jane@example.com\n"], "test.csv", { type: "text/csv" });
}

describe("importCsv", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards progress events and resolves with the final result", async () => {
    const events = [
      { type: "progress", batchesTotal: 0, batchesDone: 0, rowsProcessed: 0, totalRows: 1 },
      { type: "progress", batchesTotal: 1, batchesDone: 1, rowsProcessed: 1, totalRows: 1 },
      { type: "result", result: { success: [], skipped: [], totalRows: 1, totalImported: 0, totalSkipped: 1 } },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(ndjsonResponse(events.map((e) => JSON.stringify(e))))
    );

    const progressUpdates: unknown[] = [];
    const result = await importCsv(makeFile(), (p) => progressUpdates.push(p));

    expect(progressUpdates).toHaveLength(2);
    expect(result.totalSkipped).toBe(1);
  });

  it("throws ImportApiError when the stream reports an error event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(ndjsonResponse([JSON.stringify({ type: "error", error: "AI extraction failed" })]))
    );

    await expect(importCsv(makeFile())).rejects.toThrow("AI extraction failed");
  });

  it("throws ImportApiError when the response is a non-OK status", async () => {
    const response = new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(importCsv(makeFile())).rejects.toThrow("No file uploaded");
  });

  it("throws ImportApiError when fetch itself rejects (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(importCsv(makeFile())).rejects.toBeInstanceOf(ImportApiError);
  });

  it("throws ImportApiError when the stream ends without a result event", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        ndjsonResponse([JSON.stringify({ type: "progress", batchesTotal: 1, batchesDone: 0, rowsProcessed: 0, totalRows: 1 })])
      )
    );

    await expect(importCsv(makeFile())).rejects.toThrow("stream ended before a result was received");
  });
});
