import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../logger";

export const incomingRequestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const startTime = new Date(new Date().getTime());
  const requestId = uuidv4();
  const oldCtx = response.locals.ctx;
  response.locals.ctx = { ...oldCtx, startTime, requestId };

  const { route, method } = request;
  const path: string = route.path
  if (!path.includes("health")) {
    logger.info({ requestId, route, method }, "incoming request");
  }
  next();
};

export const outgoingLog = (request: Request, response: Response) => {
  // in milliseconds
  const responseTime =
    new Date().getTime() - response.locals.ctx.startTime.getTime();
  const { route, method } = request;
  const { locals: ctx } = response;
  const statusCode = response.statusCode;
  const path: string = route.path
  if (!path.includes("health")) {
    logger.info(
      { route, method, abi: ctx.ctx.validatedRelayRequest.encodedABI, responseTime, statusCode },
      "request completed"
    );
  }
};

export const outgoingRequestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  outgoingLog(request, response);
  next();
};
