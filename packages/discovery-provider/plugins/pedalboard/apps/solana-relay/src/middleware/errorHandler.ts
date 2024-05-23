import { Request, Response } from 'express'
import { InternalServerError, ResponseError } from '../errors'
import { logger as rootLogger } from '../logger'

export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response
) => {
  const error =
    err instanceof ResponseError ? err : new InternalServerError(String(err))
  if (!res.writableEnded) {
    res.status(error.status).send({ error: error.name })
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
