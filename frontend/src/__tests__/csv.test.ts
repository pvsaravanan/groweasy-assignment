import { describe, expect, it } from "vitest";
import { parseCsvFile } from "@/lib/csv";

function makeFile(content: string, name = "test.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("parseCsvFile", () => {
  it("parses headers and rows from arbitrary column names", async () => {
    const file = makeFile("Full Name,Email Address,Phone\nJohn Doe,john@example.com,9876543210\n");
    const result = await parseCsvFile(file);
    expect(result.headers).toEqual(["Full Name", "Email Address", "Phone"]);
    expect(result.rows).toEqual([{ "Full Name": "John Doe", "Email Address": "john@example.com", Phone: "9876543210" }]);
    expect(result.totalRows).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it("trims header whitespace", async () => {
    const file = makeFile(" Name , Email \nJane,jane@example.com\n");
    const result = await parseCsvFile(file);
    expect(result.headers).toEqual(["Name", "Email"]);
  });

  it("rejects a file with no header row", async () => {
    const file = makeFile("");
    await expect(parseCsvFile(file)).rejects.toThrow("This CSV file has no header row or is empty.");
  });

  it("caps the preview at 500 rows but reports the true total and marks it truncated", async () => {
    const header = "Name,Email\n";
    const rows = Array.from({ length: 600 }, (_, i) => `Person ${i},person${i}@example.com`).join("\n");
    const file = makeFile(header + rows);
    const result = await parseCsvFile(file);
    expect(result.totalRows).toBe(600);
    expect(result.rows).toHaveLength(500);
    expect(result.truncated).toBe(true);
  });

  it("does not mark a file at or under 500 rows as truncated", async () => {
    const header = "Name,Email\n";
    const rows = Array.from({ length: 500 }, (_, i) => `Person ${i},person${i}@example.com`).join("\n");
    const file = makeFile(header + rows);
    const result = await parseCsvFile(file);
    expect(result.totalRows).toBe(500);
    expect(result.rows).toHaveLength(500);
    expect(result.truncated).toBe(false);
  });
});
