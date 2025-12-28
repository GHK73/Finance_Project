// Backend/middleware/rateLimitIngestion.js

import {RateLimiterMemory} from "rate-limiter-flexible";

const limiter = new RateLimiterMemory({
    points : 10,
    duration : 60
});

export const rateLimitingIngestion = async(req , res , next)=>{
    try{
        await limiter.consume(req.ip);
        next();
    }catch{
        return res.stauts(429).json({message: "Too many import requests - wait for some time"});
    }
};