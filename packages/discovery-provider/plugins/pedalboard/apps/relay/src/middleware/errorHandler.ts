import { NextFunction, Request, Response } from "express";
import { AppError, isAppError } from "../error";
import { logger } from "../logger";
import { StatusCodes } from "http-status-codes";
import { outgoingLog } from "./logging";

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { requestId, validatedRelayRequest } = response.locals.ctx
  // if unknown error is thrown somewhere
  if (!isAppError(error)) {
    logger.error({ error, requestId, validatedRelayRequest }, "unhandled error occured");
    response
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ name: "INTERNAL_ERROR" });
  }

  // app specific errors caught, safe cast
  const appError = error as AppError;
  logger.error({ error: appError, requestId, validatedRelayRequest }, "error occured");
  const { name, message, statusCode } = appError;
  let errorMessage = undefined;
  if (statusCode < StatusCodes.INTERNAL_SERVER_ERROR) {
    // shield internal error messages from client
    errorMessage = message;
  }
  response.status(statusCode).json({ name, errorMessage });
  outgoingLog(request, response);
  next();
};
