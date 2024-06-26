import { NextFunction, Request, Response } from 'express'

import { InternalServerError, ResponseError } from '../errors'
import { logger as rootLogger } from '../logger'

export const errorHandlerMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const error =
    err instanceof ResponseError
      ? err
      : new InternalServerError(
          err instanceof Error ? err.message : String(err)
        )
  if (!res.headersSent) {
    res
      .status(error.status)
      .set('X-Request-ID', res.locals.requestId)
      .set('Access-Control-Expose-Headers', 'X-Request-ID')
      .send({ error: error.message })
  }
  // in milliseconds
  const responseTime = new Date().getTime() - res.locals.requestStartTime
  const statusCode = res.statusCode
  const logger = res.locals.logger ?? rootLogger
  logger.error(
    {
      responseTime,
      statusCode,
      error: error.message
    },
    'request completed'
  )
}
