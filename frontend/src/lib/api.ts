import { ImportResult } from "@/types/crm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ImportApiError extends Error {}

export interface ImportProgress {
  batchesTotal: number;
  batchesDone: number;
  rowsProcessed: number;
  totalRows: number;
}

type StreamEvent =
  | ({ type: "progress" } & ImportProgress)
  | { type: "result"; result: ImportResult }
  | { type: "error"; error: string };

/**
 * Uploads the CSV and consumes the backend's NDJSON stream: "progress" events
 * (one per completed AI batch) are forwarded to onProgress, and the terminal
 * "result" event resolves the promise.
 */
export async function importCsv(file: File, onProgress?: (progress: ImportProgress) => void): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/import`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ImportApiError(
      "Could not reach the import server. Check your connection and that the backend is running."
    );
  }

  if (!response.ok) {
    let message = `Import failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON; keep the generic message
    }
    throw new ImportApiError(message);
  }

  if (!response.body) {
    throw new ImportApiError("The import server returned an empty response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let result: ImportResult | null = null;

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    let event: StreamEvent;
    try {
      event = JSON.parse(line) as StreamEvent;
    } catch {
      throw new ImportApiError("Received a malformed response from the import server.");
    }
    if (event.type === "error") throw new ImportApiError(event.error);
    if (event.type === "result") result = event.result;
    if (event.type === "progress") onProgress?.(event);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    const lines = buffered.split("\n");
    buffered = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  handleLine(buffered);

  if (!result) {
    throw new ImportApiError("The import stream ended before a result was received.");
  }
  return result;
}
