// routes/trades.routes.js

import express from "express";
import { importTradesJson } from "../controllers/importTradesJson.js";
import { importTradesCsv } from "../controllers/importTradesCsv.js";
import { rateLimitIngestion } from "../middleware/rateLimitIngestion.js";

const router = express.Router();

router.post("/import/json", rateLimitIngestion,importTradesJson);
router.post("/import/csv", rateLimitIngestion,importTradesCsv);

export default router;
