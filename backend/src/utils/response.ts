import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response => {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  if (message) {
    body.message = message;
  }
  return res.status(statusCode).json(body);
};

export const errorResponse = (
  res: Response,
  message: string = "Something went wrong",
  statusCode: number = 500,
  errors?: any
): Response => {
  const body: ApiResponse = {
    success: false,
    message,
  };
  if (errors) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
};
