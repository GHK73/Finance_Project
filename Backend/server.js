// backend/ server.js

import express from "express";
import dotenv from "dotenv";
import "./db.js";
import tradesRouter from "./routes/trades.routes.js";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT;
app.get("/",(req,res)=>{
    res.send("Trade Reconcillation & P&L System API is running");
});

app.use("/api/trades", tradesRouter);

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
});