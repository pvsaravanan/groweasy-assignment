import { Router } from "express";
import multer from "multer";
import { parseCsvBuffer } from "../services/csvParser";
import { BATCH_SIZE, extractCrmRecords } from "../services/aiExtractor";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const isCsv = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      cb(new Error("Only CSV files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const importRouter = Router();

importRouter.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Attach a CSV file under the 'file' field." });
    return;
  }

  let parsed;
  try {
    parsed = parseCsvBuffer(req.file.buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse CSV";
    res.status(400).json({ error: message });
    return;
  }

  if (parsed.rows.length === 0) {
    res.status(400).json({ error: "CSV file contains no data rows" });
    return;
  }

  // Stream newline-delimited JSON: one "progress" event per completed AI batch,
  // then a single terminal "result" (or "error") event. Streaming starts before
  // extraction, so failures after this point are reported in-band, not via status.
  res.status(200);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.flushHeaders();

  const send = (event: Record<string, unknown>) => {
    res.write(`${JSON.stringify(event)}\n`);
  };

  const totalRows = parsed.rows.length;
  send({ type: "progress", batchesTotal: 0, batchesDone: 0, rowsProcessed: 0, totalRows });

  try {
    const result = await extractCrmRecords(parsed.rows, ({ batchesTotal, batchesDone }) => {
      send({
        type: "progress",
        batchesTotal,
        batchesDone,
        rowsProcessed: Math.min(batchesDone * BATCH_SIZE, totalRows),
        totalRows,
      });
    });
    send({ type: "result", result });
  } catch (err) {
    send({ type: "error", error: err instanceof Error ? err.message : "AI extraction failed" });
  } finally {
    res.end();
  }
});
