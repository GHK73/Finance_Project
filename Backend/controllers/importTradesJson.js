// contollers/importTradeJson

import { importTradesCore } from "../services/tradeImportService.js";

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

    const result = await importTradesCore(source, trades);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    return res.status(201).json({
      message: "Trade batch processed",
      ...result
    });

  } catch {
    return res.status(500).json({ message: "Server error during import" });
  }
};
