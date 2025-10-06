// controllers/prediction.controller.js
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const prediction = asyncHandler(async (req, res) => {
  try {
    const filters = req.body || {};
    const { startDate, endDate, region, riskThreshold } = filters;

    //  Read CSV dataset
    const transactions = [];
   const filePath = path.join(process.cwd(), "src", "data", "Bank_Transaction_Fraud_Detection.csv");


    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => transactions.push(row))
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    //  Aggregate by ATM
    const atmMap = {};
    transactions.forEach((txn) => {
      const branch = txn.Bank_Branch;
      if (!branch) return;

    //   Region filter (case-insensitive)
      if (
  region &&
  !txn.City?.toLowerCase().includes(region.toLowerCase()) &&
  !txn.State?.toLowerCase().includes(region.toLowerCase())
)
  return;


      // Initialize ATM entry
      if (!atmMap[branch]) {
        atmMap[branch] = {
          Bank_Branch: branch,
          transactions: [],
          lat: 28.6 + Math.random() * 0.15,
          lon: 77 + Math.random() * 0.2,
        };
      }

      // Date filter (CSV format: dd-mm-yyyy)
      const [day, month, year] = txn.Transaction_Date.split("-");
      const txnDate = new Date(`${year}-${month}-${day}`);
      if ((startDate && txnDate < new Date(startDate)) || (endDate && txnDate > new Date(endDate))) return;

      atmMap[branch].transactions.push(txn);
    });
   console.log("Total transactions read:", transactions.length);
console.log("ATMs after aggregation:", Object.keys(atmMap).length);


    //  Compute risk score and predicted_count
    const atms = Object.values(atmMap)
      .map((atm) => {
        const fraudCount = atm.transactions.filter((t) => Number(t.Is_Fraud) === 1).length;
        const total = atm.transactions.length || 1;
        const risk_score = Math.round((fraudCount / total) * 100) / 100;
        console.log(atm.Bank_Branch, "risk_score:", risk_score);

        return {
          Bank_Branch: atm.Bank_Branch,
          lat: atm.lat,
          lon: atm.lon,
          risk_score: risk_score,
          predicted_count: Math.min(total, 5), // simulated
          top_features: ["High txn amount", "Weekend spike", "Foreign IP"],
        };
      })
      .filter((atm) => !riskThreshold || atm.risk_score >= riskThreshold);
    
      console.log("Number of ATMs:", atms.length);
if (atms.length === 0) console.warn("WARNING: No ATM data to send to Python!");

if (atms.length === 0) {
  console.warn("WARNING: No ATM data meets risk threshold. Skipping Python call.");
  return res.json(new ApiResponse(200, "No ATM data meets the risk threshold", []));
}

    //  Call Python backend
    const pythonBackendURL = "http://0.0.0.0:8080/predict"; // Update if deployed
    // const pythonBackendURL = "http://localhost:8080/predict";

    console.log("ATMs being sent to Python:", atms);


    const pythonResp = await axios.post(pythonBackendURL, atms);
    console.log("data:  " , pythonResp.data)

    //  Respond to frontend
    res.json(new ApiResponse(200, "Prediction done successfully", pythonResp.data));
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error generating prediction");
  }
});

export { prediction };
