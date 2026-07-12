import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES, CrmRecord } from "../types/crm";

const CRM_STATUS_SET = new Set<string>(CRM_STATUS_VALUES);
const DATA_SOURCE_SET = new Set<string>(DATA_SOURCE_VALUES);

function nullIfBlank(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Escape real line breaks so every record stays a single CSV row.
  const trimmed = value.trim().replace(/\r\n|\r|\n/g, "\\n");
  return trimmed.length > 0 ? trimmed : null;
}

function isValidDate(value: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Separators the AI might jam multiple emails/phones together with, instead of
// splitting them itself per the "first value wins, rest go to crm_note" rule.
const MULTI_VALUE_SPLIT = /\s*(?:,|;|\/|&|\bor\b|\band\b)\s*/i;

function splitMultiValue(value: string): string[] {
  return value
    .split(MULTI_VALUE_SPLIT)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Code-level backstop for rule 5 (first email/mobile wins, extras go to
 * crm_note): if the AI ever returns multiple emails jammed into a single
 * "email" value instead of splitting them itself, split here so the field
 * always holds exactly one address.
 */
function splitEmailField(value: string | null): { primary: string | null; extras: string[] } {
  if (!value) return { primary: null, extras: [] };
  const parts = splitMultiValue(value).filter((p) => EMAIL_PATTERN.test(p));
  if (parts.length < 2) return { primary: value, extras: [] };
  return { primary: parts[0], extras: parts.slice(1) };
}

/** Same backstop as splitEmailField, for mobile numbers. */
function splitMobileField(value: string | null): { primary: string | null; extras: string[] } {
  if (!value) return { primary: null, extras: [] };
  const parts = splitMultiValue(value);
  if (parts.length < 2) return { primary: value, extras: [] };
  return { primary: parts[0], extras: parts.slice(1) };
}

/**
 * Defensively normalizes a raw AI-returned record: coerces invalid enum values
 * and unparseable dates to null instead of rejecting the whole batch, since the
 * AI is not guaranteed to perfectly respect the schema/prompt on every call.
 */
export function sanitizeAiRecord(raw: Record<string, unknown>): CrmRecord {
  const crmStatus = nullIfBlank(raw.crm_status);
  const dataSource = nullIfBlank(raw.data_source);
  const createdAt = nullIfBlank(raw.created_at);

  const { primary: email, extras: extraEmails } = splitEmailField(nullIfBlank(raw.email));
  const { primary: mobile, extras: extraMobiles } = splitMobileField(nullIfBlank(raw.mobile_without_country_code));
  const extraNotes = [
    ...extraEmails.map((e) => `Additional email: ${e}`),
    ...extraMobiles.map((m) => `Additional phone: ${m}`),
  ];
  const crmNote = [nullIfBlank(raw.crm_note), ...extraNotes].filter(Boolean).join("; ") || null;

  return {
    created_at: isValidDate(createdAt) ? createdAt : null,
    name: nullIfBlank(raw.name),
    email,
    country_code: nullIfBlank(raw.country_code),
    mobile_without_country_code: mobile,
    company: nullIfBlank(raw.company),
    city: nullIfBlank(raw.city),
    state: nullIfBlank(raw.state),
    country: nullIfBlank(raw.country),
    lead_owner: nullIfBlank(raw.lead_owner),
    crm_status: crmStatus && CRM_STATUS_SET.has(crmStatus) ? (crmStatus as CrmRecord["crm_status"]) : null,
    crm_note: crmNote,
    data_source: dataSource && DATA_SOURCE_SET.has(dataSource) ? (dataSource as CrmRecord["data_source"]) : null,
    possession_time: nullIfBlank(raw.possession_time),
    description: nullIfBlank(raw.description),
  };
}

export function hasContactInfo(record: CrmRecord): boolean {
  return Boolean(record.email) || Boolean(record.mobile_without_country_code);
}
