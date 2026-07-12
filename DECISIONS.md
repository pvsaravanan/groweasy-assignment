# Design decisions

The calls that actually shaped this codebase, and why I made them. I'm skipping minor
implementation details here — this is the short list of decisions that would have produced
a meaningfully different system if I'd gone the other way.

## I mapped columns with an LLM instead of hard-coding header matching

Leads come in from Facebook Lead Ads, Google Ads, Excel exports, other CRMs, hand-built
spreadsheets — each with its own header names, casing, language, and column order. A lookup
table of known header variants (`"Full Name"`, `"full_name"`, `"Name"`, ...) only covers
variants I've already seen, and silently fails on the one I haven't. Sending raw rows to
Gemini with a schema-and-rules prompt generalizes to shapes I never anticipated. The cost is
that I now have to treat the AI's output as untrusted and re-validate it server-side — that
felt like a fair trade for not having to enumerate header variants forever, and it's the
decision everything else in this list exists to support.

## I never trust the AI's output as pre-validated

`backend/src/utils/validation.ts` re-checks every field the AI returns — invalid enum values
and unparseable dates get coerced to `null`, and I re-enforce the must-have-contact-info skip
rule even if the AI's own `_skipped` flag missed it. Gemini's structured output constrains
the *shape* of the response, not whether it's *correct* — I've seen this schema come back
with hallucinated enum-adjacent strings and unparseable dates. I decided to treat the AI the
same way I'd treat client-submitted form data: never trusted, always re-checked server-side.
That way a model having a bad day degrades to some rows getting skipped, not bad data landing
in the CRM.

## I added a row-accounting backstop after finding rows could vanish silently

I found this directly while testing: I swapped in `gemini-3.5-flash` and it returned 1 record
for a 4-row batch. My original code had no accounting for rows the AI just didn't echo
back — they disappeared from both the success and skipped lists with no error, and I got a
nonsensical `totalRows: 4, totalImported: 0, totalSkipped: 1` result staring back at me. I
fixed it by having `aiExtractor.ts` diff the AI's returned `_row` values against the input
batch and force-skip anything missing (reason: `"AI did not return this row"`), and ignore
duplicate/invented `_row` values instead of double-counting them. Now
`totalImported + totalSkipped === totalRows` always holds, no matter what the model does —
this is the single most important integrity guarantee in the pipeline, because it's the one
thing standing between "the AI misbehaved" and "leads silently disappeared."

## I settled on `gemini-3-flash-preview` with no fallback model configured

This took real trial and error against my actual API key, not a guess from documentation.
`gemini-2.5-flash`/`-lite` returned `404` on my key's project. `gemini-3.5-flash` and
`gemini-flash-latest` dropped all but one row and stripped almost every field, even after
tuning `thinkingBudget`/`thinkingLevel`. `gemini-3.1-flash-lite` looped the same record until
it hit `MAX_TOKENS`. The 2.0 and pro-tier models had zero free-tier quota on my key.
`gemini-3-flash-preview` was the only one that actually produced correct, complete mappings
when I tested it directly. I left `GEMINI_FALLBACK_MODEL` empty rather than point it at any
of the broken models — a fallback that silently mangles data is worse than no fallback, and
the row-accounting backstop above means "the model returned nothing" already surfaces
cleanly as a skipped row instead of corrupting anything.

## I made `/api/import` stream NDJSON instead of one blocking response

Large CSVs take real time to process across multiple AI batches, and I didn't want the user
staring at a spinner with zero feedback for tens of seconds, or risking a proxy timeout on a
big file. A WebSocket/SSE channel would give me progress updates too, but at the cost of a
second connection and more infrastructure. Streaming newline-delimited JSON over the same
request/response the upload already uses — one `progress` event per completed batch, then a
terminal `result`/`error` — gets me live progress with no extra moving parts. The trade-off
is that naive HTTP clients (curl, Postman without streaming mode) see multiple JSON objects
instead of one; I called that out explicitly in the README so it doesn't read as a bug.

## I kept the CSV preview entirely client-side, with no AI call until explicit confirm

Every AI call costs money and quota, and I hit that limit myself more than once while
testing this project. I didn't want a user idly scrolling through their file's preview to
burn API calls before they'd even decided to import. The preview step parses the CSV in the
browser with Papaparse and never touches the backend — the AI only runs once the user
explicitly clicks "Confirm Import." This one decision is what makes the free-tier quota
constraints survivable at all.

## I batch rows with bounded concurrency, and isolate a failed batch to just its own rows

One call per row would scale cost and latency linearly with file size and blow through
per-minute rate limits fast. One call for an entire large file risks exceeding output token
limits — I actually saw `gemini-3.1-flash-lite` hit `MAX_TOKENS` on just a 4-row batch under
some conditions, so this isn't a hypothetical risk. I chunk into batches of `AI_BATCH_SIZE`
(20) with up to `AI_BATCH_CONCURRENCY` (3) in flight, and if one batch still fails after
retries and fallback, only its own rows get marked skipped — the import as a whole still
returns a partial result instead of the whole request failing. If batch 3 of 10 hits a
transient error, that shouldn't cost the user the 9 batches that already succeeded.
