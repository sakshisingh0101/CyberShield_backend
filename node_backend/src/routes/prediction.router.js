import { Router } from "express";
import { prediction } from "../controllers/prediction.controllers.js";
const predictionRouter= Router();
predictionRouter.route("/hotspotPrediction").post(prediction)
export default predictionRouter