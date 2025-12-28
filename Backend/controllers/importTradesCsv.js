import multer from "multer";
import csv from "csv-parser";
import { pipeline } from "stream/promises";
import { importTradesCore } from "../services/tradeImportService.js";

const upload = multer();

export const importTradesCsv = async (req, res) => {
  upload.single("file")(req, res, async (err) => {
    try {

      if (err) {
        return res.status(400).json({ message: "File upload failed" });
      }

      const { source } = req.body;

      if (!source || !req.file) {
        return res.status(400).json({ message: "Source and CSV file are required" });
      }

      const trades = [];

      await pipeline(
        req.file.stream,
        csv(),
        async function* (rows) {
          for await (const r of rows) {

            trades.push({
              trade_id: r.trade_id,
              symbol: r.symbol,
              side: r.side,
              quantity: Number(r.quantity),
              price: Number(r.price),
              fee: Number(r.fee || 0),
              trade_time: r.trade_time
            });

            if (trades.length > 2000) {
              throw new Error("BATCH_LIMIT");
            }
          }
        }
      );

      const result = await importTradesCore(source, trades);

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }

      return res.status(201).json({
        message: "CSV trade batch processed",
        inserted: result.inserted,
        duplicates: result.duplicates,
        total_received: result.total_received
      });

    } catch (error) {

      if (error.message === "BATCH_LIMIT") {
        return res.status(400).json({
          message: "Batch too large — maximum 2000 trades allowed per import"
        });
      }

      console.error("Error during CSV import:", error);
      return res.status(500).json({ message: "Server error during CSV import" });
    }
  });
};
