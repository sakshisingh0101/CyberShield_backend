import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser'


const app=express();
// const allowedOriginsString = process.env.CORS_ORIGIN;
// const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(',').map(s => s.trim()) : [];
//  app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));
const allowedOriginsString = process.env.CORS_ORIGIN;

// 1. Convert the comma-separated string from the environment variable into an array.
//    If CORS_ORIGIN is undefined, it defaults to an empty array.
const allowedOrigins = allowedOriginsString 
    ? allowedOriginsString.split(',').map(s => s.trim()) 
    : [];

console.log('Allowed CORS Origins:', allowedOrigins);

app.use(cors({
    // 2. Pass the array of allowed origins directly to the 'origin' option.
    //    The 'cors' middleware handles the validation logic internally, 
    //    making the custom function unnecessary.
    origin: allowedOrigins,
    credentials: true,
    // Note: You don't usually need to explicitly allow methods/headers 
    // unless you are using non-standard ones, but it's good practice:
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", 
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
// ---
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