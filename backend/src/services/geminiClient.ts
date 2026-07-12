import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from "../types/crm";

const MODEL_NAME = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

const recordItemSchema = {
  type: SchemaType.OBJECT,
  properties: {
    _row: { type: SchemaType.NUMBER, description: "Original row index passed in the input, echoed back." },
    _skipped: { type: SchemaType.BOOLEAN, description: "True if this row must be skipped (no email and no mobile)." },
    _skip_reason: { type: SchemaType.STRING, description: "Why the row was skipped, if _skipped is true." },
    created_at: { type: SchemaType.STRING, nullable: true },
    name: { type: SchemaType.STRING, nullable: true },
    email: { type: SchemaType.STRING, nullable: true },
    country_code: { type: SchemaType.STRING, nullable: true },
    mobile_without_country_code: { type: SchemaType.STRING, nullable: true },
    company: { type: SchemaType.STRING, nullable: true },
    city: { type: SchemaType.STRING, nullable: true },
    state: { type: SchemaType.STRING, nullable: true },
    country: { type: SchemaType.STRING, nullable: true },
    lead_owner: { type: SchemaType.STRING, nullable: true },
    crm_status: { type: SchemaType.STRING, enum: [...CRM_STATUS_VALUES], nullable: true },
    crm_note: { type: SchemaType.STRING, nullable: true },
    data_source: { type: SchemaType.STRING, enum: [...DATA_SOURCE_VALUES], nullable: true },
    possession_time: { type: SchemaType.STRING, nullable: true },
    description: { type: SchemaType.STRING, nullable: true },
  },
  required: ["_row"],
};

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    records: { type: SchemaType.ARRAY, items: recordItemSchema },
  },
  required: ["records"],
};

const SYSTEM_PROMPT = `You are a data-mapping engine for a real-estate CRM called GrowEasy.
You will be given an array of raw CSV rows (as JSON objects with arbitrary column names)
coming from unknown sources such as Facebook Lead Ads exports, Google Ads exports, Excel
sheets, other CRM exports, or manually built spreadsheets. Your job is to intelligently map
the fields in each row to the fixed GrowEasy CRM schema below, regardless of the original
column names, casing, ordering, or language.

CRM fields to produce for every row:
- created_at: lead creation date/time. Must be a string parseable by JavaScript's
  "new Date(created_at)". Prefer ISO 8601 ("YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss").
  If no date-like field exists, leave null.
- name: the lead's full name.
- email: the lead's primary email address.
- country_code: phone country code including "+" (e.g. "+91"). Infer from context/phone
  format when possible; otherwise null.
- mobile_without_country_code: the lead's mobile number WITHOUT the country code.
- company: company name.
- city, state, country: location fields.
- lead_owner: the salesperson/agent/owner assigned to this lead (often an email or name).
- crm_status: MUST be exactly one of ${CRM_STATUS_VALUES.join(", ")}, or null if nothing
  in the row confidently maps to one of these statuses. Infer from any status/stage/remark
  column using its meaning (e.g. "interested", "follow up" -> GOOD_LEAD_FOLLOW_UP; "not
  reachable", "no response" -> DID_NOT_CONNECT; "not interested", "junk" -> BAD_LEAD; "won",
  "closed", "booked" -> SALE_DONE).
- crm_note: free-form notes. Put here: remarks, follow-up notes, additional comments, and
  any extra emails or phone numbers beyond the first one (see below). Combine multiple
  pieces of extra info with "; " separators. If nothing applies, use null.
- data_source: MUST be exactly one of ${DATA_SOURCE_VALUES.join(", ")}, or null if nothing
  matches confidently. Do not guess.
- possession_time: property possession time/date if present, else null.
- description: any additional descriptive text about the lead/property that doesn't fit
  elsewhere, else null.

Rules:
1. If a row has multiple email addresses, use the first as "email" and append the rest to
   "crm_note".
2. If a row has multiple phone numbers, use the first as "mobile_without_country_code" (with
   its country code split into "country_code") and append the rest to "crm_note".
3. If a row has NEITHER an email NOR a mobile number anywhere in it, set "_skipped": true and
   "_skip_reason" to a short explanation. Still echo back "_row" for skipped rows. Do not
   invent an email or phone number.
4. Always echo back the original "_row" index for every input row, exactly once, whether kept
   or skipped.
5. Never fabricate data that is not present or reasonably inferable from the row. Use null
   for anything you cannot determine.
6. Return ONLY the JSON object matching the provided schema, no prose, no markdown fences.`;

export interface GeminiBatchInput {
  _row: number;
  data: Record<string, unknown>;
}

export async function callGeminiForBatch(batch: GeminiBatchInput[], modelName = MODEL_NAME): Promise<unknown> {
  const generationConfig: Record<string, unknown> = {
    responseMimeType: "application/json",
    responseSchema,
    temperature: 0,
  };
  // Gemini 2.5 models "think" before answering; unbounded thinking multiplies latency,
  // but a budget of 0 makes the model drop fields on this schema. 512 keeps output
  // quality while cutting latency roughly in half. Gemini 3.x models use a different
  // `thinkingLevel` knob and reject `thinkingBudget` — and "low" makes them drop most
  // records/fields on this schema, so 3.x is left on its default thinking behavior.
  if (modelName.startsWith("gemini-2.5")) {
    generationConfig.thinkingConfig = { thinkingBudget: 512 };
  }

  const model = getClient().getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: generationConfig as never,
  });

  const prompt = `Map the following ${batch.length} CSV rows to the GrowEasy CRM schema.
Input rows (JSON array, each with its "_row" index and raw "data" columns):

${JSON.stringify(batch)}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}
