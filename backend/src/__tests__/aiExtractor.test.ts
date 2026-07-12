import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/geminiClient", () => ({
  callGeminiForBatch: vi.fn(),
}));

import { extractCrmRecords } from "../services/aiExtractor";
import { callGeminiForBatch } from "../services/geminiClient";

const mockedCall = vi.mocked(callGeminiForBatch);

function row(name: string, email: string): Record<string, string> {
  return { full_name: name, email, city: "Bengaluru" };
}

function aiRecord(rowIndex: number, name: string, email: string) {
  return {
    _row: rowIndex,
    created_at: null,
    name,
    email,
    country_code: null,
    mobile_without_country_code: null,
    company: null,
    city: "Bengaluru",
    state: null,
    country: null,
    lead_owner: null,
    crm_status: null,
    crm_note: null,
    data_source: null,
    possession_time: null,
    description: null,
  };
}

describe("extractCrmRecords row accounting", () => {
  beforeEach(() => {
    mockedCall.mockReset();
  });

  it("imports every row when the AI echoes all of them", async () => {
    mockedCall.mockResolvedValue({
      records: [aiRecord(0, "A", "a@x.com"), aiRecord(1, "B", "b@x.com")],
    });

    const result = await extractCrmRecords([row("A", "a@x.com"), row("B", "b@x.com")]);

    expect(result.totalImported).toBe(2);
    expect(result.totalSkipped).toBe(0);
    expect(result.totalImported + result.totalSkipped).toBe(result.totalRows);
  });

  it("force-skips rows the AI silently drops so every row is accounted for", async () => {
    // 3 rows in, AI only echoes row 1 — rows 0 and 2 must not vanish.
    mockedCall.mockResolvedValue({
      records: [aiRecord(1, "B", "b@x.com")],
    });

    const result = await extractCrmRecords([
      row("A", "a@x.com"),
      row("B", "b@x.com"),
      row("C", "c@x.com"),
    ]);

    expect(result.totalRows).toBe(3);
    expect(result.totalImported).toBe(1);
    expect(result.totalSkipped).toBe(2);
    expect(result.totalImported + result.totalSkipped).toBe(result.totalRows);

    const skippedRows = result.skipped.map((s) => s.row).sort();
    expect(skippedRows).toEqual([0, 2]);
    for (const s of result.skipped) {
      expect(s.reason).toMatch(/did not return/i);
      expect(s.raw).toEqual(expect.objectContaining({ full_name: expect.any(String) }));
    }
  });

  it("ignores duplicate/unknown _row indices from the AI without double-counting", async () => {
    // AI echoes row 0 twice and invents row 99; only one row 0 should import.
    mockedCall.mockResolvedValue({
      records: [aiRecord(0, "A", "a@x.com"), aiRecord(0, "A", "a@x.com"), aiRecord(99, "Ghost", "g@x.com")],
    });

    const result = await extractCrmRecords([row("A", "a@x.com")]);

    expect(result.totalRows).toBe(1);
    expect(result.totalImported + result.totalSkipped).toBe(result.totalRows);
  });
});
