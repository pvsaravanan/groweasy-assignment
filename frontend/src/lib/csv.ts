import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  truncated: boolean;
}

const MAX_PREVIEW_ROWS = 500;

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        if (headers.length === 0) {
          reject(new Error("This CSV file has no header row or is empty."));
          return;
        }
        const totalRows = result.data.length;
        resolve({
          headers,
          rows: result.data.slice(0, MAX_PREVIEW_ROWS),
          totalRows,
          truncated: totalRows > MAX_PREVIEW_ROWS,
        });
      },
      error: (err: Error) => reject(err),
    });
  });
}

export function countCsvRows(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    let count = 0;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      step: () => {
        count += 1;
      },
      complete: () => resolve(count),
      error: (err: Error) => reject(err),
    });
  });
}
