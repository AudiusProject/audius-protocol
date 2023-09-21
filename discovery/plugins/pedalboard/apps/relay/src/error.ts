import { NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

/** Various options for error types that can be returned from middleware or handlers. */
export interface AppError {
  name: string;
  statusCode: StatusCodes;
  message: string;
  // only need to check presence to know if app error
  isAppError?: boolean;
}

export const isAppError = (obj: any): obj is AppError => {
  return obj && "isAppError" in obj;
};

/** Calls express next function to advance middleware to error handling. */
export const customError = (next: NextFunction, error: AppError) => {
  next({ ...error, isAppError: true });
};

/** Error constructors */

export const validationError = (next: NextFunction, message: string) => {
  customError(next, {
    name: "VALIDATION_ERROR",
    statusCode: StatusCodes.BAD_REQUEST,
    message,
  });
};

export const internalError = (next: NextFunction, message: string) => {
  customError(next, {
    name: "INTERNAL_ERROR",
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message,
  });
};

export const rateLimitError = (next: NextFunction, message: string) => {
  customError(next, {
    name: "RATE_LIMIT_ERROR",
    statusCode: StatusCodes.UNAUTHORIZED,
    message,
  });
};

export const antiAbuseError = (next: NextFunction, message: string) => {
  customError(next, {
    name: "ANTI_ABUSE_ERROR",
    statusCode: StatusCodes.UNAUTHORIZED,
    message,
  });
};
