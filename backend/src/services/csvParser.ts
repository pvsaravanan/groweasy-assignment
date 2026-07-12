import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  const text = buffer.toString("utf-8");
  if (text.trim().length === 0) {
    throw new Error("CSV file is empty");
  }

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    const fatal = result.errors.filter((e) => e.type !== "FieldMismatch");
    if (fatal.length > 0) {
      throw new Error(`CSV parse error: ${fatal[0].message}`);
    }
  }

  const headers = result.meta.fields ?? [];
  if (headers.length === 0) {
    throw new Error("CSV file has no header row or is empty");
  }

  return { headers, rows: result.data };
}
