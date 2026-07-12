import { describe, expect, it } from "vitest";
import { parseCsvBuffer } from "../services/csvParser";

describe("parseCsvBuffer", () => {
  it("parses headers and rows from arbitrary column names", () => {
    const csv = "Full Name,Email Address,Phone\nJohn Doe,john@example.com,9876543210\n";
    const { headers, rows } = parseCsvBuffer(Buffer.from(csv));
    expect(headers).toEqual(["Full Name", "Email Address", "Phone"]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      "Full Name": "John Doe",
      "Email Address": "john@example.com",
      Phone: "9876543210",
    });
  });

  it("throws on an empty file", () => {
    expect(() => parseCsvBuffer(Buffer.from(""))).toThrow("CSV file is empty");
  });
});
