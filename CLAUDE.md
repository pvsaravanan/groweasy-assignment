# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

An AI-powered CSV importer for the GrowEasy real-estate CRM. Users upload a CSV of leads in
*any* shape (Facebook Lead Ads, Google Ads, Excel exports, other CRM exports, manual sheets),
and the backend uses Gemini to intelligently map arbitrary columns into a fixed CRM schema —
no hard-coded column-name matching.

```
backend/    Express + TypeScript API: CSV parsing, batched AI field-mapping, validation
frontend/   Next.js (App Router) + TypeScript + Tailwind UI: upload, preview, confirm, results
samples/    Sample CSVs shaped like different lead sources, for manual/evaluator testing
docker-compose.yml   Runs both services together
```

## Commands

### Backend (`backend/`)
- `npm run dev` — start API with hot reload (tsx watch) on `:4000`
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled build
- `npm run lint` — ESLint over `src`
- `npm test` — run all tests (vitest)
- `npx vitest run src/__tests__/validation.test.ts` — run a single test file
- `npx vitest run -t "test name"` — run tests matching a name

### Frontend (`frontend/`)
- `npm run dev` — Next.js dev server on `:3000`
- `npm run build` / `npm start` — production build/serve
- `npm run lint` — ESLint
- `npm test` — run all tests (vitest + Testing Library, jsdom environment; config in `vitest.config.ts`)
- `npx vitest run src/__tests__/csv.test.ts` — run a single test file
- `npx vitest run -t "test name"` — run tests matching a name

### Docker
- `GEMINI_API_KEY=your-key-here docker compose up --build` — runs both services (frontend `:3000`, backend `:4000`)

### Env setup
Backend needs `backend/.env` (copy from `.env.example`) with `GEMINI_API_KEY` required.
Frontend needs `frontend/.env.local` with `NEXT_PUBLIC_API_BASE_URL` (defaults to
`http://localhost:4000`). Key backend tuning vars: `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`,
`AI_BATCH_SIZE` (default 20), `AI_BATCH_CONCURRENCY` (default 3).

## Architecture

### End-to-end flow
1. **Upload** (frontend) — drag/drop or file picker (`Dropzone.tsx`).
2. **Preview** (frontend) — CSV parsed client-side with Papaparse (`lib/csv.ts`), rendered in
   `DataTable.tsx` with sticky headers; virtualizes via `@tanstack/react-virtual` once rows
   exceed 100. **No AI call happens at this stage.**
3. **Confirm** — only on explicit user confirmation does the frontend POST the raw file to
   `POST /api/import` (`lib/api.ts` → `importCsv`).
4. **Backend pipeline** (`routes/import.ts`):
   - `services/csvParser.ts` parses the uploaded buffer into rows.
   - `services/aiExtractor.ts` (`extractCrmRecords`) splits rows into batches of
     `AI_BATCH_SIZE`, processes batches with bounded concurrency (`utils/retry.ts` →
     `mapWithConcurrency`), and per-batch retries with exponential backoff
     (`withRetry`).
   - Each batch is sent to Gemini via `services/geminiClient.ts`, which enforces a strict
     JSON response schema (Gemini's structured-output `responseSchema`) and carries the field
     -mapping system prompt (enum constraints for `crm_status`/`data_source`, multi-email/phone
     handling, skip-if-no-contact-info rule).
   - On primary-model capacity/quota errors (`503`/`429`), the batch fails over immediately to
     `GEMINI_FALLBACK_MODEL` rather than retrying the same model.
   - A batch that still fails after retries + fallback is not thrown — every row in it is
     marked `_skipped` so the rest of the import still succeeds.
   - `utils/validation.ts` re-validates every AI-returned record server-side regardless of what
     the model claimed: enum values and dates are coerced to `null` if invalid, and rows
     without an email or mobile are force-skipped even if the AI missed the rule. **Never trust
     the AI's output as pre-validated.**
5. **Streaming response**: `POST /api/import` does not return a single JSON blob — it streams
   newline-delimited JSON (`application/x-ndjson`) with one `progress` event per completed
   batch and a final `result` (or `error`) event, then ends the response. The frontend
   (`lib/api.ts`) reads this stream incrementally to drive `ProcessingIndicator.tsx`. When
   touching this endpoint, keep the frontend's NDJSON parsing (`lib/api.ts`) in sync with any
   change to the event shape.
6. **Results** (frontend) — `ResultView.tsx` renders imported vs. skipped records in tabs, with
   `totalImported`/`totalSkipped` counts.

### Key types
The CRM record schema and its two closed enums (`CRM_STATUS_VALUES`, `DATA_SOURCE_VALUES`) are
defined once in `backend/src/types/crm.ts` (Zod) and mirrored in `frontend/src/types/crm.ts`
(TS types) — keep both in sync if the schema changes. The Gemini response schema in
`geminiClient.ts` must also stay in sync with `CrmRecordSchema`.

### Gemini model quirks (see comments in `geminiClient.ts`)
- Gemini 2.5 models need `thinkingConfig.thinkingBudget` set (512) — a budget of 0 causes
  dropped fields, and unbounded thinking multiplies latency.
- Gemini 3.x models use a different `thinkingLevel` knob and reject `thinkingBudget`; "low"
  causes dropped records on this schema, so 3.x models are left on default thinking behavior.
  Any model-name-conditional logic here needs updating together if new model families are added.

### Backend hardening
`index.ts` applies `helmet()` for security headers, a 10-req/min `express-rate-limit` scoped
to `/api/import` (the one AI-calling route worth protecting from accidental hammering), and a
JSON 404 handler (registered before the error handler) so unknown routes don't fall through to
Express's default HTML 404.

### Row tracing
Every row carries a `_row` index end-to-end (input batch → AI response → success/skipped
lists), used to map AI output back to the original CSV row and to report skip reasons. Don't
break this threading when modifying `aiExtractor.ts`.
