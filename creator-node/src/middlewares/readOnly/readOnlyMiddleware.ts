import type { Request, Response, NextFunction } from 'express'
import { sendResponse, errorResponseServerError } from '../../apiHelpers'
import config from '../../config'

const EXCLUDED_ROUTES: string[] = [
  '/health_check',
  '/batch_cids_exist',
  '/batch_image_cids_exist',
  '/batch_id_to_cid'
]

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
  const originalUrl = req.originalUrl
  const canProceed = canProceedInReadOnlyMode(
    isReadOnlyMode,
    spIDNotDefined,
    method,
    originalUrl
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
 * @param {String} originalUrl request url string e.g. /health_check/sync
 * @returns {Boolean} returns true if the request can proceed. eg GET in read only or any request in non read-only mode
 */
export function canProceedInReadOnlyMode(
  isReadOnlyMode: boolean,
  spIDNotDefined: boolean,
  method: string,
  originalUrl: string
) {
  if (spIDNotDefined && !EXCLUDED_ROUTES.includes(originalUrl)) return false
  if (
    isReadOnlyMode &&
    method !== 'GET' &&
    !EXCLUDED_ROUTES.includes(originalUrl)
  ) {
    return false
  }
  return true
}
