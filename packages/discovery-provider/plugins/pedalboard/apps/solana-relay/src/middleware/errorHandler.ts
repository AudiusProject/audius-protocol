import { NextFunction, Request, Response } from 'express'

import { ResponseError } from '../errors'
import { logger as rootLogger } from '../logger'

export const errorHandlerMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = error instanceof ResponseError ? error.status : 500
  if (!res.headersSent) {
    res
      .status(status)
      .set('X-Request-ID', res.locals.requestId)
      .set('Access-Control-Expose-Headers', 'X-Request-ID')
      .send({ error: (error as any).toString() })
  }
  // in milliseconds
  const responseTime = new Date().getTime() - res.locals.requestStartTime
  const statusCode = res.statusCode
  const logger = (res.locals.logger ?? rootLogger).child({
    responseTime,
    statusCode
  })
  logger.error(error, 'request completed')
}
