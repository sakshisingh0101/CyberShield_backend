import { Router } from "express";
import { getRegions } from "../controllers/region.controllers.js";

const regionRouter= Router();
regionRouter.route("/getregions").get(getRegions)

export default regionRouter