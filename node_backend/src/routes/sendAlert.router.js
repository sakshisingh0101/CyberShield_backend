import { Router } from "express";
import { sendAlert } from "../controllers/sendAlert.controller.js";

const sendAlertRouter= Router();
sendAlertRouter.route("/send").post(sendAlert)
export default sendAlertRouter