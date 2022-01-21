import config from './config'
import { Request, Response } from 'express'

import {
  requestNotExcludedFromLogging,
  getDuration,
  setFieldsInChildLogger
} from './logging'
import { generateTimestampAndSignature } from './apiSigning'


// constants
const HEARTBEAT_INTERVAL: number = 5000

const StatusCode = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUESTED_RANGE_NOT_SATISFIABLE: 416,
  INTERNAL_SERVER_ERROR: 500
} as const

// function types
type VoidResponseHandler = (req: Request, res: Response, next: Function) => Promise<void>

type ResponseHandler = (req: Request, res: Response, next: Function) => Promise<AudiusApiResponse>

type VoidMiddleware = (req: Request, res: Response, resp: AudiusApiResponse) => void

type Responder = (payload: object) => AudiusApiResponse

type ErrorResponder = (message: string) => AudiusApiResponse

// data 
type AudiusApiResponse {
  statusCode: number
  object: any
}

type CNodeResponse {
  data: CNodeResponseData
}

type CNodeResponseData {
  data: object
  signer: string
  timestamp: string
  signature: string
}

type ParsedCNodeResponse {
  responseData: object
  signatureData: object
}

export const handleResponse = (responseHandler: ResponseHandler): VoidResponseHandler => {
  return async function (req, res, next) {
    try {
      const resp = await responseHandler(req, res, next)
      sendResponse(req, res, resp)
      next()
    } catch (error) {
      console.error('HandleResponse', error)
      next(error)
    }
  }
}

/**
 * Like `handleResponse` but on an interval sends a heartbeat back through
 * `res.write` as a piece of the JSON result
 * @param {() => void} func returns the response JSON
 */

export const handleResponseWithHeartbeat = (responseHandler: ResponseHandler): VoidResponseHandler => {
  return async function (req, res, next) {
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
      const heartbeatInterval = setInterval((): void => {
        if (!res.writableEnded) {
          res.write('1')
        }
      }, HEARTBEAT_INTERVAL)

      const resp: AudiusApiResponse = await responseHandler(req, res, next)
      clearInterval(heartbeatInterval)

      sendResponseWithHeartbeatTerminator(req, res, resp)
      next()
    } catch (error) {
      sendResponseWithHeartbeatTerminator(req, res, errorResponse(500, error))
    }
  }
}

export const sendResponse: VoidMiddleware = (req, res, resp) => {
  const duration = getDuration(req)
  let logger = setFieldsInChildLogger(req, {
    duration,
    statusCode: resp.statusCode
  })

  if (resp.statusCode === StatusCode.OK) {
    if (requestNotExcludedFromLogging(req.originalUrl)) {
      logger.info('Success')
    }
  } else {
    logger = logger.child({
      errorMessage: resp.object.error
    })
    if (req && req.body) {
      logger.info(
        'Error processing request:',
        resp.object.error,
        '|| Request Body:',
        req.body,
        '|| Request Query Params:',
        req.query
      )
    } else {
      logger.info('Error processing request:', resp.object.error)
    }
  }

  // set custom CORS headers that's required if you want to response
  // headers through axios
  res.set('Access-Control-Expose-Headers', 'CN-Request-ID')

  res.status(resp.statusCode).send(resp.object)
}

export const sendResponseWithHeartbeatTerminator: VoidMiddleware = (req, res, resp) => {
  const duration = getDuration(req)
  let logger = setFieldsInChildLogger(req, {
    duration,
    statusCode: resp.statusCode
  })
  if (resp.statusCode === StatusCode.OK) {
    if (requestNotExcludedFromLogging(req.originalUrl)) {
      logger.info('Success')
    }
  } else {
    logger = logger.child({
      errorMessage: resp.object.error
    })
    if (req && req.body) {
      logger.info(
        'Error processing request:',
        resp.object.error,
        '|| Request Body:',
        req.body
      )
    } else {
      logger.info('Error processing request:', resp.object.error)
    }

    // Converts the error object into an object that JSON.stringify can parse
    if (resp.object.error) {
      resp.object.error = Object.getOwnPropertyNames(
        resp.object.error
      ).reduce((acc, cur) => {
        acc[cur] = resp.object.error[cur]
        return acc
      }, {})
    }
  }

  // Construct the remainder of the JSON response
  let response = '",'
  // Replace the first '{' since we already have that
  response += JSON.stringify(resp.object).replace('{', '')

  // Terminate the response
  res.end(response)
}

export const successResponse: Responder = (payload = {}) => {
  const toSignData = {
    data: {
      ...payload
    },
    signer: config.get('delegateOwnerWallet')
  }

  const { timestamp, signature }: { timestamp: string, signature: string } = generateTimestampAndSignature(
    toSignData,
    config.get('delegatePrivateKey')
  )

  return {
    statusCode: StatusCode.OK,
    object: {
      ...toSignData,
      timestamp,
      signature
    }
  }
}

export const errorResponse = (statusCode: number, message: string): AudiusApiResponse => {
  return {
    statusCode,
    object: { error: message }
  }
}

export const errorResponseUnauthorized: ErrorResponder = (message) => {
  return errorResponse(StatusCode.UNAUTHORIZED, message)
}

export const errorResponseForbidden: ErrorResponder = (message) => {
  return errorResponse(StatusCode.FORBIDDEN, message)
}

export const errorResponseBadRequest: ErrorResponder = (message) => {
  return errorResponse(StatusCode.BAD_REQUEST, message)
}

export const errorResponseRangeNotSatisfiable: ErrorResponder = (message) => {
  return errorResponse(StatusCode.REQUESTED_RANGE_NOT_SATISFIABLE, message)
}

export const errorResponseServerError: ErrorResponder = (message) => {
  return errorResponse(StatusCode.INTERNAL_SERVER_ERROR, message)
}

export const errorResponseNotFound: ErrorResponder = (message) => {
  return errorResponse(StatusCode.NOT_FOUND, message)
}

export const errorResponseSocketTimeout = (socketTimeout: any) => {
  return errorResponse(
    StatusCode.INTERNAL_SERVER_ERROR,
    `${socketTimeout} socket timeout exceeded for request`
  )
}

/**
 * Define custom api error subclasses to be thrown in components and handled in route controllers
 */

class ErrorBadRequest extends Error { }
Object.defineProperty(ErrorBadRequest.prototype, 'name', {
  value: 'ErrorBadRequest'
})
class ErrorServerError extends Error { }
Object.defineProperty(ErrorServerError.prototype, 'name', {
  value: 'ErrorServerError'
})

module.exports.ErrorBadRequest = ErrorBadRequest
module.exports.ErrorServerError = ErrorServerError

/**
 * Given an error instance, returns the corresponding error response to request
 * @param {Error} error instance of error class or subclass
 */
module.exports.handleApiError = (error: Error) => {
  switch (error) {
    case ErrorBadRequest:
      return this.errorResponseBadRequest(error.message)
    case ErrorServerError:
      return this.errorResponseServerError(error.message)
    default:
      return this.errorResponseServerError(error.message)
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
module.exports.parseCNodeResponse = (respObj: CNodeResponse, requiredFields: string[] = []): ParsedCNodeResponse => {
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
