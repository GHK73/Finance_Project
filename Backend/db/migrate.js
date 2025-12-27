// Backend/db/migrate.js

import {pool} from "../db.js";

async function runMigrations(){
    try{
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trade_sources(
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            description TEXT
            );

            CREATE TABLE IF NOT EXISTS trades(
            id SERIAL PRIMARY KEY,
            trade_id VARCHAR(50) NOT NULL,
            source_id INT REFERENCES trade_sources(id),
            symbol VARCHAR(20) NOT NULL,
            side VARCHAR(10) CHECK(side IN('BUY','SELL')),
            quantity NUMERIC(18,4) NOT NULL,
            price NUMERIC(18,6) DEFAULT 0,
            trade_time TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS exception_logs(
            id SERIAL PRIMARY KEY,
            trade_id VARCHAR(50),
            category VARCHAR(50),
            message TEXT,
            severity VARCHAR(10),
            created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS pnl_summary(
            id Serial PRIMARY KEY,
            symbol VARCHAR(20),
            date DATE,
            realized_pnl NUMERIC(18,6),
            unrealized_pnl NUMERIC(18,6),
            created_at TIMESTAMP DEFAULT NOW()
            );
            `);
            console.log("✅ Database tables created");
            process.exit(0);
    }catch(err){
        console.error("❌ Migration error:", err.message);
        process.exit(1);
    }
}

runMigrations();