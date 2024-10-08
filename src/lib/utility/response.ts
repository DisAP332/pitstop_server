import { Response } from "express";

// Standardized response structure
export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  payload: T | null = null
) => {
  res.status(statusCode).json({
    success,
    message,
    payload,
  });
};
