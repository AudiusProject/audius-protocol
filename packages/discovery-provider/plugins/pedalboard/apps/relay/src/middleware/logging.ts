import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../logger'

export const incomingRequestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const startTime = new Date(new Date().getTime())
  const requestId =
    typeof request.headers['X-Request-Id'] === 'string'
      ? (request.headers['X-Request-ID'] as string)
      : uuidv4()
  const oldCtx = response.locals.ctx
  const requestLogger = logger.child({ startTime, requestId })
  response.locals.ctx = {
    ...oldCtx,
    startTime,
    requestId,
    logger: requestLogger
  }

  const { route, method } = request
  const path: string = route.path
  if (!path.includes('health')) {
    logger.info({ requestId, path, method }, 'incoming request')
  }
  next()
}

export const outgoingLog = (request: Request, response: Response) => {
  // in milliseconds
  const responseTime =
    new Date().getTime() - response.locals.ctx.startTime.getTime()
  const { route, method } = request
  const { locals: ctx } = response
  const requestId = ctx.ctx.requestId
  const statusCode = response.statusCode
  const path: string = route.path
  if (!path.includes('health')) {
    response.locals.ctx.logger.info(
      { responseTime, statusCode },
      'request completed'
    )
  }
}

export const outgoingRequestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  outgoingLog(request, response)
  next()
}
