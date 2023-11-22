import { NextFunction, Request, Response } from 'express'
import { ResponseError } from '../errors'
import { logger } from '../logger'

const getErrorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message !== ''
      ? error.message
      : error.name
    : 'Internal Server Error'

export const errorHandlerMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ResponseError) {
    res.status(err.status).send({ error: getErrorMessage(err) })
  } else {
    res.status(500).send({ error: getErrorMessage(err) })
  }
  // in milliseconds
  const responseTime = new Date().getTime() - res.locals.ctx.startTime.getTime()
  const { route, method } = req
  const { locals: ctx } = res
  const statusCode = res.statusCode
  logger.info(
    {
      route,
      method,
      ctx,
      responseTime,
      statusCode,
      error: getErrorMessage(err)
    },
    'request completed'
  )
}
