// // controllers/prediction.controller.js
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asynchandler.js";
// import axios from "axios";
// import fs from "fs";
// import path from "path";
// import csv from "csv-parser";

// // import axios from "axios";

// const geocodeCache = {}; // avoid repeating API calls

// async function getCoordinates(branch, city, state) {
//   const key = `${branch}_${city}_${state}`;
//   if (geocodeCache[key]) return geocodeCache[key];

//   const query = encodeURIComponent(`${branch}, ${city}, ${state}, India`);
//   const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;

//   try {
//     const res = await axios.get(url, { headers: { 'User-Agent': 'ATM-Risk-Heatmap' } });
//     if (res.data.length > 0) {
//       const { lat, lon } = res.data[0];
//       const coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
//       geocodeCache[key] = coords;
//       return coords;
//     } else {
//       console.warn(`No geocode found for ${branch}`);
//       return { lat: 28.6 + Math.random() * 0.15, lon: 77 + Math.random() * 0.2 }; // fallback
//     }
//   } catch (err) {
//     console.error("Geocoding error:", err.message);
//     return { lat: 28.6 + Math.random() * 0.15, lon: 77 + Math.random() * 0.2 }; // fallback
//   }
// }

// // actual previous code : 

// const prediction = asyncHandler(async (req, res) => {
//   try {
//     const filters = req.body || {};
//     const { startDate, endDate, region, riskThreshold } = filters;

//     //  Read CSV dataset
//     const transactions = [];
//     const filePath = path.join(process.cwd(), "src", "data", "Bank_Transaction_Fraud_Detection.csv");

//     await new Promise((resolve, reject) => {
//       fs.createReadStream(filePath)
//         .pipe(csv())
//         .on("data", (row) => transactions.push(row))
//         .on("end", () => resolve())
//         .on("error", (err) => reject(err));
//     });

//     //  Aggregate by ATM
//     const atmMap = {};
//     for (const txn of transactions) {
//       const branch = txn.Bank_Branch;
//       if (!branch) continue;

//       if (
//         region &&
//         !txn.City?.toLowerCase().includes(region.toLowerCase()) &&
//         !txn.State?.toLowerCase().includes(region.toLowerCase())
//       ) continue;

//       if (!atmMap[branch]) {
//         const coords = await getCoordinates(branch, txn.City, txn.State);
//         atmMap[branch] = {
//           Bank_Branch: branch,
//           transactions: [],
//           lat: coords.lat,
//           lon: coords.lon,
//         };
//       }

//       // rest of your logic (date filter etc.)

//       // Date filter (CSV format: dd-mm-yyyy)
//       const [day, month, year] = txn.Transaction_Date.split("-");
//       const txnDate = new Date(`${year}-${month}-${day}`);
//       if ((startDate && txnDate < new Date(startDate)) || (endDate && txnDate > new Date(endDate))) continue;

//       atmMap[branch].transactions.push(txn);
//     }

//     console.log("Total transactions read:", transactions.length);
//     console.log("ATMs after aggregation:", Object.keys(atmMap).length);

//     //  Compute risk score and predicted_count
//     const atms = Object.values(atmMap)
//       .map((atm) => {
//         const fraudCount = atm.transactions.filter((t) => Number(t.Is_Fraud) === 1).length;
//         const total = atm.transactions.length || 1;
//         const risk_score = Math.round((fraudCount / total) * 100) / 100;
//         console.log(atm.Bank_Branch, "risk_score:", risk_score);

//         return {
//           Bank_Branch: atm.Bank_Branch,
//           lat: atm.lat,
//           lon: atm.lon,
//           risk_score: risk_score,
//           predicted_count: Math.min(total, 5), // simulated
//           top_features: ["High txn amount", "Weekend spike", "Foreign IP"],
//         };
//       })
//       .filter((atm) => !riskThreshold || atm.risk_score >= riskThreshold);

//     console.log("Number of ATMs:", atms.length);
//     if (atms.length === 0) console.warn("WARNING: No ATM data to send to Python!");

//     if (atms.length === 0) {
//       console.warn("WARNING: No ATM data meets risk threshold. Skipping Python call.");
//       return res.json(new ApiResponse(200, "No ATM data meets the risk threshold", []));
//     }

//     //  Call Python backend
//     const pythonBackendURL = `${process.env.PYTHON_BACKEND_URL}/predict`;

//     console.log("ATMs being sent to Python:", atms);

//     const pythonResp = await axios.post(pythonBackendURL, atms, { timeout: 60000 });
//     console.log("data:  ", pythonResp.data);

//     //  Respond to frontend
//     res.json(new ApiResponse(200, "Prediction done successfully", pythonResp.data));
//   } catch (err) {
//     console.error(err);
//     throw new ApiError(500, "Error generating prediction");
//   }
// });

// export { prediction };




// controllers/prediction.controller.js
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const geocodeCache = {}; // cache to avoid redundant API calls

async function getCoordinates(branch, city, state) {
  const key = `${branch}_${city}_${state}`;
  if (geocodeCache[key]) return geocodeCache[key];

  const query = encodeURIComponent(`${branch}, ${city}, ${state}, India`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;

  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'ATM-Risk-Heatmap' } });
    if (res.data.length > 0) {
      const { lat, lon } = res.data[0];
      const coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
      geocodeCache[key] = coords;
      return coords;
    } else {
      console.warn(`No geocode found for ${branch}`);
      return { lat: 28.6 + Math.random() * 0.15, lon: 77 + Math.random() * 0.2 };
    }
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return { lat: 28.6 + Math.random() * 0.15, lon: 77 + Math.random() * 0.2 };
  }
}

const prediction = asyncHandler(async (req, res) => {
  try {
    const filters = req.body || {};
    const { startDate, endDate, region, riskThreshold } = filters;

    const transactions = [];
    const filePath = path.join(process.cwd(), "src", "data", "Bank_Transaction_Fraud_Detection.csv");

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => transactions.push(row))
        .on("end", () => resolve())
        .on("error", (err) => reject(err));
    });

    const atmMap = {};
    for (const txn of transactions) {
      const branch = txn.Bank_Branch;
      if (!branch) continue;

      // region-based filter
      if (
        region &&
        !txn.City?.toLowerCase().includes(region.toLowerCase()) &&
        !txn.State?.toLowerCase().includes(region.toLowerCase())
      )
        continue;

      if (!atmMap[branch]) {
        const coords = await getCoordinates(branch, txn.City, txn.State);
        atmMap[branch] = {
          Bank_Branch: branch,
          transactions: [],
          lat: coords.lat,
          lon: coords.lon,
        };
      }

      // Parse date safely (CSV format: dd-mm-yyyy)
      const [day, month, year] = txn.Transaction_Date.split("-");
      const txnDate = new Date(`${year}-${month}-${day}`);
      if ((startDate && txnDate < new Date(startDate)) || (endDate && txnDate > new Date(endDate))) continue;

      atmMap[branch].transactions.push({ ...txn, txnDate });
    }

    console.log("Total transactions read:", transactions.length);
    console.log("ATMs after aggregation:", Object.keys(atmMap).length);

    const atms = Object.values(atmMap)
      .map((atm) => {
        const total = atm.transactions.length || 1;
        const now = new Date();

        let weightedFraud = 0;
        let recentFraudBoost = 0;

        atm.transactions.forEach((t) => {
          if (Number(t.Is_Fraud) === 1) {
            weightedFraud += 1;

            // recency-based weight: last 30 days count more
            const daysAgo = Math.floor((now - new Date(t.txnDate)) / (1000 * 60 * 60 * 24));
            if (daysAgo <= 30) recentFraudBoost += 1.5;
            else if (daysAgo <= 90) recentFraudBoost += 1.2;
            else recentFraudBoost += 1;
          }
        });

        // Weighted + recency-based score
        let risk_score = ((weightedFraud * 2 + recentFraudBoost) / Math.sqrt(total)) / 10;

        // Normalize and cap between 0–1
        risk_score = Math.min(1, Math.max(0.05, Math.round(risk_score * 100) / 100));

        return {
          Bank_Branch: atm.Bank_Branch,
          lat: atm.lat,
          lon: atm.lon,
          risk_score,
          predicted_count: Math.min(total, 5),
          top_features: ["High txn amount", "Weekend spike", "Foreign IP"],
        };
      })
      .filter((atm) => !riskThreshold || atm.risk_score >= riskThreshold);

    console.log("Number of ATMs meeting threshold:", atms.length);
    if (atms.length === 0) {
      console.warn("No ATM data meets the risk threshold. Skipping Python call.");
      return res.json(new ApiResponse(200, "No ATM data meets the risk threshold", []));
    }

    // Call Python backend for clustering & hotspots
    const pythonBackendURL = `${process.env.PYTHON_BACKEND_URL}/predict`;
    console.log("Sending ATMs to Python:", atms.length);

    const pythonResp = await axios.post(pythonBackendURL, atms, { timeout: 60000 });
    console.log("Python Response:", pythonResp.data);

    res.json(new ApiResponse(200, "Prediction done successfully", pythonResp.data));
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error generating prediction");
  }
});

export { prediction };
