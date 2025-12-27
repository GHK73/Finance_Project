// backend/db.js

import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const {Pool} = pkg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {rejectUnauthorized: false}
});

(async()=>{
    try{
        const res = await pool.query("SELECT NOW()");
        console.log("✅ Connected to PostgreSQL:", res.rows[0].now);
    }catch(err){
        console.err("❌ DB connection failed:", err.message);
    }
})();