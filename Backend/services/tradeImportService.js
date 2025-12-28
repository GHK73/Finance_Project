import { pool } from "../db.js";

export async function importTradesCore(source, trades) {
  try {

    if (!source || !Array.isArray(trades) || trades.length === 0) {
      return { error: "Source and trades[] are required" };
    }

    const sourceResult = await pool.query(
      "SELECT id FROM trade_sources WHERE name = $1 LIMIT 1",
      [source]
    );

    if (sourceResult.rowCount === 0) {
      return { error: "Invalid trade source" };
    }

    const source_id = sourceResult.rows[0].id;

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
            Number(t.quantity),
            Number(t.price),
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

    return {
      inserted,
      duplicates,
      total_received: trades.length
    };

  } catch (error) {
    console.error("Error during trade import:", error);
    return { error: "Trade import failed" };
  }
}
