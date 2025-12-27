// routes/trades.routes.js

import express from "express";
import {importTradesJson} from "../controllers/trades.controllers.js";

const router = express.Router();

router.post("/import/json",importTradesJson);

export default router;