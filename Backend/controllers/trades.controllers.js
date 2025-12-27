import { pool } from "../db.js";

export const importTradesJson = async (req, res) => {
  try {
    const { source, trades } = req.body;

    if (!source || !Array.isArray(trades) || trades.length === 0) {
      return res.status(400).json({ message: "Source and trades[] are required" });
    }

    if (trades.length > 2000) {
      return res.status(400).json({
        message: "Batch too large — maximum 2000 trades allowed per import"
      });
    }

    const sourceResult = await pool.query(
      "SELECT id FROM trade_sources WHERE name = $1 LIMIT 1",
      [source]
    );

    if (sourceResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid trade source" });
    }

    const source_id = sourceResult.rows[0].id;

    let inserted = 0;
    let duplicates = 0;

    for (const t of trades) {
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
            t.fee || 0,
            t.trade_time
          ]
        );

        inserted++;
      } catch (err) {
        if (err.code === "23505") {
          duplicates++;
          continue;
        }
        throw err;
      }
    }

    return res.status(201).json({
      message: "Trade batch processed",
      inserted,
      duplicates,
      total_received: trades.length
    });

  } catch (error) {
    console.error("Error during trade import:", error);
    return res.status(500).json({ message: "Server error during import" });
  }
};
