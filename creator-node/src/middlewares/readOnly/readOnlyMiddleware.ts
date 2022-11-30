import type { Request, Response, NextFunction } from 'express'
import { sendResponse, errorResponseServerError } from '../../apiHelpers'
import config from '../../config'

/**
 * Middleware to block all non-GET api calls if the server should be in "read-only" mode
 */
export function readOnlyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isReadOnlyMode = config.get('isReadOnlyMode')
  const spIDNotDefined = !config.get('spID') || config.get('spID') <= 0 // true if not a valid spID
  const method = req.method
  const canProceed = readOnlyMiddlewareHelper(
    isReadOnlyMode,
    spIDNotDefined,
    method
  )

  if (!canProceed)
    return sendResponse(
      req,
      res,
      errorResponseServerError('Server is in read-only mode at the moment')
    )
  next()
}

/**
 * @param {Boolean} isReadOnlyMode From config.get('isReadOnlyMode')
 * @param {Boolean} spIDNotDefined set in serviceRegistry after recovering this node's identity. true if not a valid spID
 * @param {String} method REST method for this request eg. POST, GET
 * @returns {Boolean} returns true if the request can proceed. eg GET in read only or any request in non read-only mode
 */
export function readOnlyMiddlewareHelper(
  isReadOnlyMode: boolean,
  spIDNotDefined: boolean,
  method: string
) {
  if ((isReadOnlyMode || spIDNotDefined) && method !== 'GET') {
    return false
  }

  return true
}
