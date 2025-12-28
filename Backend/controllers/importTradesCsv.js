// Backend/controllers/importTradesCsv.js

import multer from "multer";
import csv from "csv-parser";
import { pipeline } from "stream/promises";
import { pool } from "../db.js";

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

      const sourceResult = await pool.query(
        "SELECT id FROM trade_sources WHERE name = $1 LIMIT 1",
        [source]
      );

      if (sourceResult.rowCount === 0) {
        return res.status(400).json({ message: "Invalid trade source" });
      }

      const source_id = sourceResult.rows[0].id;

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

      let inserted = 0;
      let duplicates = 0;

      for (const t of trades) {

        if (!t.trade_id || !t.symbol || !t.side || !t.quantity || !t.price || !t.trade_time) {
          continue;
        }

        try {
          await pool.query(
            `
            INSERT INTO trades
            (trade_id, source_id, symbol, side, quantity, price, fee, trade_time)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `,
            [
              t.trade_id,
              source_id,
              t.symbol,
              t.side,
              t.quantity,
              t.price,
              t.fee,
              t.trade_time
            ]
          );

          inserted++;

        } catch (e) {
          if (e.code === "23505") {
            duplicates++;
            continue;
          }
          throw e;
        }
      }

      return res.status(201).json({
        message: "CSV trade batch processed",
        inserted,
        duplicates,
        total_received: trades.length
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
