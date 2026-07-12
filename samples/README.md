# Sample CSVs

Six CSVs, each shaped like a different real-world lead source, covering the messy/ambiguous
cases the AI mapping is expected to handle. Use these to try the importer without having to
find or fabricate your own test data.

| File | Mimics | Exercises |
| --- | --- | --- |
| `facebook_leads_export.csv` | Facebook Lead Ads export | `data_source` inferred from the ad/form name column; a fully-blank row that must be skipped |
| `google_ads_export.csv` | Google Ads export | `DD/MM/YYYY HH:mm` date reformatting; campaign-name → `data_source` inference; a contactless row that must be skipped |
| `manual_spreadsheet.csv` | Hand-built spreadsheet | Ambiguous headers (`Sl No`, `Number 1`/`Number 2`, `Mail`); a second phone number folded into `crm_note`; status inferred from free-text notes; no `created_at` column at all |
| `marketing_agency_export.csv` | Agency/CRM export | `Status`/`Source` columns with human phrasing (e.g. "Junk lead" → `BAD_LEAD`, "Deal won" → `SALE_DONE`) instead of the literal enum values |
| `excel_sheet_export.csv` | Excel sheet | Two emails and two phone numbers jammed into single cells (exercises the multi-value split in `validation.ts`); an obvious spam/test row; a row missing the name |
| `crm_native_export.csv` | Already-native CRM export | Headers exactly match the target schema (near no-op mapping); `data_source`, `possession_time`, `description` all blank, confirming the AI leaves ungiven fields `null` instead of inventing values |

## Try one

**Via the UI**: `npm run dev` in both `backend/` and `frontend/`, then drag any of these files
into the importer at `http://localhost:3000`.

**Via curl** (reads the terminal `result` line of the NDJSON stream — see the README's note on
streaming responses):

```bash
curl -s -X POST http://localhost:4000/api/import \
  -F "file=@samples/facebook_leads_export.csv;type=text/csv" | tail -1
```
