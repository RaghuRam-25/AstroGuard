import { Router } from "express";
import { getSpaceWeather, getApod } from "../controllers/nasa.controller.js";

const router = Router();

router.get("/space-weather", getSpaceWeather);
router.get("/radiation", getSpaceWeather);
router.get("/apod", getApod);

export default router;
