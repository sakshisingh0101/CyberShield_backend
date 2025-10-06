import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser'


const app=express();
const allowedOriginsString = process.env.CORS_ORIGIN;
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(',').map(s => s.trim()) : [];
 app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json(
    {
        limit:"16kb"
    }
))
app.use(express.urlencoded({extended:true,limit:'16kb'}))
app.use(express.static("public"))
app.use(cookieParser())

import predictionRouter from './routes/prediction.router.js';
import regionRouter from './routes/regions.routes.js';


app.use("/api/v1/cybercrime",predictionRouter)
app.use("/api/v1/regions",regionRouter)
export {app}