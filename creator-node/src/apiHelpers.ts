import type { Request, Response, NextFunction } from 'express'
import type { AxiosResponse } from 'axios'
import type Logger from 'bunyan'
import type { ApiResponse, CustomRequest } from './utils'

import { tracing } from './tracer'

import config from './config'

import {
  getDuration,
  createChildLogger,
  logger as genericLogger
} from './logging'
import { generateTimestampAndSignature } from './apiSigning'

export const handleResponse = <
  TAsyncFunction extends (...args: any[]) => Promise<any>
>(
  func: TAsyncFunction
) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const resp = await func(req, res, next)

      if (!isValidResponse(resp)) {
        throw new Error('Invalid response returned by function')
      }

      sendResponse(req as any, res, resp)
      next()
    } catch (error: any) {
      tracing.recordException(error)
      genericLogger.error('HandleResponse', error)
      next(error)
    }
  }
}

/**
 * Like `handleResponse` but on an interval sends a heartbeat back through
 * `res.write` as a piece of the JSON result
 * @param {() => void} func returns the response JSON
 */
export const handleResponseWithHeartbeat = <
  TAsyncFunction extends (...args: any[]) => Promise<any>
>(
  func: TAsyncFunction
) => {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      // First declare our content type since we will be sending heartbeats back
      // in JSON
      res.set('Content-Type', 'application/json; charset=utf-8')

      // set custom CORS headers that's required if you want to response
      // headers through axios
      res.set('Access-Control-Expose-Headers', 'CN-Request-ID')

      // Write a key for the heartbeat
      res.write('{"_h":"')

      // Fire up an interval that will append a single char to the res
      const heartbeatInterval = setInterval(() => {
        if (!res.finished) {
          res.write('1')
        }
      }, 5000)

      // Await the work of the endpoint
      const resp = await func(req, res, next)

      clearInterval(heartbeatInterval)

      sendResponseWithHeartbeatTerminator(req, res, resp)
      next()
    } catch (error: any) {
      tracing.recordException(error)
      sendResponseWithHeartbeatTerminator(req, res, errorResponse(500, error))
    }
  }
}

export const sendResponse = (
  req: Request,
  res: Response,
  resp: ApiResponse
) => {
  const reqWithLogger = req as CustomRequest
  const duration = getDuration(req as any)
  let logger = createChildLogger(reqWithLogger.logger, {
    duration,
    statusCode: resp.statusCode
  }) as Logger

  if (resp.statusCode !== 200) {
    logger = createChildLogger(logger, {
      errorMessage: resp.object.error
    }) as Logger
    if (req && req.body) {
      logger.error(
        'Error processing request:',
        resp.object.error,
        '|| Request Body:',
        req.body,
        '|| Request Query Params:',
        req.query
      )
    } else {
      logger.error('Error processing request:', resp.object.error)
    }
  }

  // set custom CORS headers that's required if you want to response
  // headers through axios
  res.set('Access-Control-Expose-Headers', 'CN-Request-ID')

  res.status(resp.statusCode).send(resp.object)
}

export const sendResponseWithHeartbeatTerminator = (
  req: Request,
  res: Response,
  resp: ApiResponse
) => {
  const duration = getDuration(req as any)
  const reqWithLogger = req as CustomRequest
  let logger = createChildLogger(reqWithLogger.logger, {
    duration,
    statusCode: resp.statusCode
  }) as Logger

  if (resp.statusCode !== 200) {
    logger = createChildLogger(logger, {
      errorMessage: resp.object.error
    }) as Logger
    if (req && req.body) {
      logger.error(
        'Error processing request:',
        resp.object.error,
        '|| Request Body:',
        req.body
      )
    } else {
      logger.error('Error processing request:', resp.object.error)
    }

    // Converts the error object into an object that JSON.stringify can parse
    if (resp.object.error) {
      resp.object.error = Object.getOwnPropertyNames(resp.object.error).reduce(
        (acc: Record<any, any>, cur: any) => {
          acc[cur] = resp.object.error![cur]
          return acc
        },
        {}
      )
    }
  }

  // Construct the remainder of the JSON response
  let response = '",'
  // Replace the first '{' since we already have that
  response += JSON.stringify(resp.object).replace('{', '')

  // Terminate the response
  res.end(response)
}

export const isValidResponse = (resp: ApiResponse) => {
  if (!resp || !resp.statusCode || !resp.object) {
    return false
  }

  return true
}

export const successResponse = (obj = {}) => {
  const toSignData = {
    data: {
      ...obj
    },
    signer: config.get('delegateOwnerWallet')
  }

  const { timestamp, signature } = generateTimestampAndSignature(
    toSignData,
    config.get('delegatePrivateKey')
  )

  return {
    statusCode: 200,
    object: {
      ...toSignData,
      timestamp,
      signature
    }
  }
}

export const errorResponse = (statusCode: number, message: string) => {
  return {
    statusCode: statusCode,
    object: { error: message }
  }
}

export const errorResponseUnauthorized = (message: string) => {
  return errorResponse(401, message)
}

export const errorResponseForbidden = (message: string) => {
  return errorResponse(403, message)
}

export const errorResponseBadRequest = (message: string) => {
  return errorResponse(400, message)
}

module.exports.errorResponseRangeNotSatisfiable = (message: string) => {
  return errorResponse(416, message)
}

export const errorResponseServerError = (message: string) => {
  return errorResponse(500, message)
}

export const errorResponseNotFound = (message: string) => {
  return errorResponse(404, message)
}

export const errorResponseSocketTimeout = (socketTimeout: number) => {
  return errorResponse(
    500,
    `${socketTimeout} socket timeout exceeded for request`
  )
}

/**
 * Define custom api error subclasses to be thrown in components and handled in route controllers
 */

export class ErrorBadRequest extends Error {
  declare name: string
  constructor(message: string) {
    super(message)
    this.name = 'ErrorBadRequest'
  }
}

export class ErrorServerError extends Error {
  declare name: string
  constructor(message: string) {
    super(message)
    this.name = 'ErrorServiceError'
  }
}

/**
 * Given an error instance, returns the corresponding error response to request
 * @param {Error} error instance of error class or subclass
 */
export const handleApiError = (error: any) => {
  switch (error) {
    case ErrorBadRequest:
      return errorResponseBadRequest(error.message)
    case ErrorServerError:
      return errorResponseServerError(error.message)
    default:
      return errorResponseServerError(error.message)
  }
}

/**
 * Helper function to parse responses from axios requests to other Content Nodes.
 *    Given a response object and required fields, errors if any required fields missing.
 *    Also errors if any signature fields missing.
 *    Unnests response data.data and returns formatted data, along with raw response object.
 *    Uses response schema defined above in successResponse()
 * @param {Object} respObj original response object from axios request to content node
 * @param {string[]} requiredFields
 */
export const parseCNodeResponse = (
  respObj: AxiosResponse,
  requiredFields = []
) => {
  if (!respObj.data || !respObj.data.data) {
    throw new Error('Unexpected respObj format')
  }

  requiredFields.map((requiredField) => {
    if (!respObj.data.data[requiredField]) {
      throw new Error(
        `CNodeResponse missing required data field: ${requiredField}`
      )
    }
  })

  const signatureFields = ['signer', 'timestamp', 'signature']
  signatureFields.map((signatureField) => {
    if (!respObj.data[signatureField]) {
      throw new Error(
        `CNodeResponse missing required signature field: ${signatureField}`
      )
    }
  })

  return {
    responseData: respObj.data.data,
    signatureData: {
      signer: respObj.data.signer,
      timestamp: respObj.data.timestamp,
      signature: respObj.data.signature
    }
  }
}
