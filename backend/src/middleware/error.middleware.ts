import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { errorResponse } from "../utils/response.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("❌ Global Error Handler Caught:", err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return errorResponse(res, "Validation Error", 400, formattedErrors);
  }

  // Handle Mongoose cast error / duplicate key error
  if (err.name === "CastError") {
    return errorResponse(res, `Resource not found with id: ${err.value}`, 404);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return errorResponse(res, `Duplicate field value entered for '${field}'`, 409);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return errorResponse(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return errorResponse(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
};
