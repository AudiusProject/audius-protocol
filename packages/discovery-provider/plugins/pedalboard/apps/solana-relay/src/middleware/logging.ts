import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../logger'

export const incomingRequestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const startTime = new Date().getTime()
  response.locals.requestStartTime = startTime
  const requestId = uuidv4()
  const { path, method } = request
  response.locals.logger = logger.child({
    requestId,
    path,
    method
  })
  response.locals.logger.info(
    { startTime: new Date(startTime), body: request.body },
    'incoming request'
  )
  next()
}

export const outgoingLog = (_request: Request, response: Response) => {
  // in milliseconds
  const responseTime = new Date().getTime() - response.locals.requestStartTime
  const statusCode = response.statusCode
  response.locals.logger.info({ responseTime, statusCode }, 'request completed')
}

export const outgoingRequestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  outgoingLog(request, response)
  next()
}
