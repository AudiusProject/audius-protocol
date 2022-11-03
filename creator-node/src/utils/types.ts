import type Logger from 'bunyan'
import type { Request } from 'express'

export type ValuesOf<T> = T[keyof T]

// Content node app adds additional fields to the Express request object. This typing
// is a type that adds additional fields to the request object.
export type CustomRequest = Request & {
  logger: Logger
  logContext?: LogContext
  normalizedPath?: string
  startTime?: [number, number]
}

export type LogContext = {
  requestID: string
}

export type ApiResponse = {
  statusCode: number
  object: {
    error?: any
    timestamp?: Date
    signature?: string
    data?: any
    signer?: string
  }
}
