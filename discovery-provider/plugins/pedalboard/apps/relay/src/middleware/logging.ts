import { NextFunction, Request, Response } from "express";
import { logger } from "../logger";

export const incomingRequestLogger = (request: Request, response: Response, next: NextFunction) => {
    logger.info({ request }, "incoming request")
    next()
}

export const outgoingRequestLogger = (request: Request, response: Response, next: NextFunction) => {
    // in milliseconds
    const responseTime = new Date().getTime() - response.locals.ctx.startTime.getTime()
    logger.info({ request, response, responseTime }, "request completed")
    next()
}
