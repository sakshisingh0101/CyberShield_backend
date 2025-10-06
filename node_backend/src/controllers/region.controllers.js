import fs from "fs";
import path from "path";
import csv from "csv-parser";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const getRegions = asyncHandler(async (req, res) => {
  try {
    const cities = new Set(); // To store unique cities

    // Path to your CSV file
    const filePath = path.join(process.cwd(), "src", "data", "Bank_Transaction_Fraud_Detection.csv");

    // Read CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          if (row.City && row.City.trim() !== "") {
            cities.add(row.City.trim());
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Convert Set to sorted array
    const regionList = Array.from(cities).sort();

    return res.json(new ApiResponse(200, "Regions fetched successfully", regionList));
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error fetching regions from dataset");
  }
});

export { getRegions };
