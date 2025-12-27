// controllers/trades.controllers.js

import {pool} from "../db.js";

export const importTradesJson = async(req,res)=>{
    try{
        const {source,trades} = req.body;
        if(!source || !trades || !Array.isArray(trades)){
            return res.status(400).json({message: "Sources and trades[] are required"});
        }

        const sourceResult = await pool.query(
            "Select id FROM trade_sources WHERE name = $1 LIMIT 1",
            [source]
        );

        if(sourceResult.rowCount === 0){
            return res.status(400).json({message:"Invalid trade Source"});
        }

        const source_id = sourceResult.rows[0].id;

        for(const trade of trades){
            await pool.query(
                `
                INSERT INTO trades
                (trade_id,source_id,symbol,side ,quantity,price ,fee ,trade_time )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                `, 
                [
                    trade.trade_id,
                    source_id,
                    trade.symbol,
                    trade.side,
                    trade.quantity,
                    trade.price,
                    trade.fee || 0,
                    trade.trade_time
                ]
            );
        }
        return res.status(201).json({message:"Trades Imported Successfully",count: trades.length});
    }catch(error){
        console.error("Error during trade import:", error);
        return res.status(500).json({message:"Server error during import"});
    }
};