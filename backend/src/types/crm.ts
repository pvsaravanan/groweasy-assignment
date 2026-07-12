import { z } from "zod";

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];
export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

// Schema for a single record as returned by the AI model. All fields are
// optional/nullable except the ones the model must always attempt to fill.
export const CrmRecordSchema = z.object({
  created_at: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  mobile_without_country_code: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  lead_owner: z.string().nullable().optional(),
  crm_status: z.enum(CRM_STATUS_VALUES).nullable().optional(),
  crm_note: z.string().nullable().optional(),
  data_source: z.enum(DATA_SOURCE_VALUES).nullable().optional(),
  possession_time: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  // Row index in the original CSV (0-based, excluding header), used to trace
  // an AI-returned record back to its source row and to report skip reasons.
  _row: z.number().optional(),
});

export type CrmRecord = z.infer<typeof CrmRecordSchema>;

export const AiBatchResponseSchema = z.object({
  records: z.array(
    CrmRecordSchema.extend({
      _skipped: z.boolean().optional(),
      _skip_reason: z.string().optional(),
    })
  ),
});

export interface ImportResult {
  success: CrmRecord[];
  skipped: Array<{ row: number; reason: string; raw: Record<string, unknown> }>;
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}
