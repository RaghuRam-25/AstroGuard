import { Request, Response } from "express";
import { NasaService } from "../services/nasa.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const getSpaceWeather = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await NasaService.getSpaceWeatherAndRadiation();
    successResponse(res, data, 200, "NASA Space Weather and Radiation data retrieved successfully");
  } catch (error) {
    errorResponse(res, "Failed to retrieve NASA Space Weather telemetry", 500, error);
  }
};

export const getApod = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await NasaService.getApod();
    successResponse(res, data, 200, "NASA Astronomy Picture of the Day retrieved successfully");
  } catch (error) {
    errorResponse(res, "Failed to retrieve NASA APOD", 500, error);
  }
};
