import { NextFunction, Request, Response } from "express";
import { AppError, isAppError } from "../error";
import { logger } from "../logger";
import { StatusCodes } from "http-status-codes";

export const errorHandler = (
  error: any,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  // if unknown error is thrown somewhere
  if (!isAppError(error)) {
    logger.error({ error }, "unhandled error occured");
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ name: "INTERNAL_ERROR" });
  }

  // app specific errors caught, safe cast
  const appError = error as AppError;
  logger.error({ appError }, "AppError occured");
  const { name, message, statusCode } = appError;
  response.status(statusCode).json({ name, message });
};
