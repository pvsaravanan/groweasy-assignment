import { describe, expect, it } from "vitest";
import { hasContactInfo, sanitizeAiRecord } from "../utils/validation";

describe("sanitizeAiRecord", () => {
  it("nulls out invalid crm_status values", () => {
    const record = sanitizeAiRecord({ crm_status: "NOT_A_REAL_STATUS", name: "Jane" });
    expect(record.crm_status).toBeNull();
    expect(record.name).toBe("Jane");
  });

  it("keeps valid crm_status and data_source values", () => {
    const record = sanitizeAiRecord({ crm_status: "SALE_DONE", data_source: "eden_park" });
    expect(record.crm_status).toBe("SALE_DONE");
    expect(record.data_source).toBe("eden_park");
  });

  it("nulls out unparseable created_at", () => {
    const record = sanitizeAiRecord({ created_at: "not a date" });
    expect(record.created_at).toBeNull();
  });

  it("keeps a valid ISO created_at", () => {
    const record = sanitizeAiRecord({ created_at: "2026-05-13 14:20:48" });
    expect(record.created_at).toBe("2026-05-13 14:20:48");
  });

  it("treats blank strings as null", () => {
    const record = sanitizeAiRecord({ name: "   " });
    expect(record.name).toBeNull();
  });

  it("escapes line breaks so records stay single CSV rows", () => {
    const record = sanitizeAiRecord({ crm_note: "line one\nline two\r\nline three" });
    expect(record.crm_note).toBe("line one\\nline two\\nline three");
  });

  it("splits multiple emails jammed into a single field, keeping the first and noting the rest", () => {
    const record = sanitizeAiRecord({ email: "a@example.com, b@example.com" });
    expect(record.email).toBe("a@example.com");
    expect(record.crm_note).toBe("Additional email: b@example.com");
  });

  it("splits multiple mobile numbers jammed into a single field", () => {
    const record = sanitizeAiRecord({ mobile_without_country_code: "9812345670 / 9900011111" });
    expect(record.mobile_without_country_code).toBe("9812345670");
    expect(record.crm_note).toBe("Additional phone: 9900011111");
  });

  it("appends extra emails/mobiles after any existing crm_note", () => {
    const record = sanitizeAiRecord({
      email: "a@example.com and b@example.com",
      crm_note: "Client is asking to reschedule demo",
    });
    expect(record.crm_note).toBe("Client is asking to reschedule demo; Additional email: b@example.com");
  });

  it("leaves a single email/mobile untouched", () => {
    const record = sanitizeAiRecord({ email: "a@example.com", mobile_without_country_code: "9812345670" });
    expect(record.email).toBe("a@example.com");
    expect(record.mobile_without_country_code).toBe("9812345670");
    expect(record.crm_note).toBeNull();
  });
});

describe("hasContactInfo", () => {
  it("returns true when email is present", () => {
    expect(hasContactInfo({ email: "a@b.com" })).toBe(true);
  });

  it("returns true when mobile is present", () => {
    expect(hasContactInfo({ mobile_without_country_code: "9876543210" })).toBe(true);
  });

  it("returns false when neither is present", () => {
    expect(hasContactInfo({ name: "Jane" })).toBe(false);
  });
});
