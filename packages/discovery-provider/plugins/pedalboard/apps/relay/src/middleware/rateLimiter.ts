import { RelayRateLimiter, ValidLimits } from '../config/rateLimitConfig'
import { AudiusABIDecoder } from '@audius/sdk/dist/libs'
import { RateLimiterRes } from 'rate-limiter-flexible'
import { DeveloperApps, Users } from '@pedalboard/storage'
import { config } from '..'
import { NextFunction, Request, Response } from 'express'
import { rateLimitError } from '../error'

const globalRateLimiter = new RelayRateLimiter()

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    validatedRelayRequest,
    recoveredSigner,
    signerIsUser,
    isAnonymousAllowed,
    isSenderVerifier,
    logger
  } = res.locals.ctx
  const { encodedABI } = validatedRelayRequest

  // don't rate limit on local dev, this can block audius-cmd
  if (config.environment === 'dev') {
    next()
    return
  }

  let signer: string | null
  if (signerIsUser) {
    signer = (recoveredSigner as Users).wallet!
  } else {
    signer = (recoveredSigner as DeveloperApps).address
  }

  if (
    (signer === undefined || signer === null) &&
    !isAnonymousAllowed &&
    !isSenderVerifier
  ) {
    rateLimitError(next, 'user record does not have wallet')
    return
  }

  // if not EM transaction, return
  if (
    res.locals.ctx.validatedRelayRequest.contractRegistryKey !== 'EntityManager'
  ) {
    next()
    return
  }

  const operation = getEntityManagerActionKey(encodedABI)

  const isBlockedFromRelay = config.rateLimitBlockList.includes(signer)
  if (isBlockedFromRelay) {
    rateLimitError(next, 'blocked from relay')
    return
  }

  const limit = await determineLimit(
    signerIsUser,
    isAnonymousAllowed,
    config.rateLimitAllowList,
    signer
  )

  try {
    const rateLimitData = await globalRateLimiter.consume({
      operation,
      signer,
      limit
    })
    logger.info({ limit }, 'calculated rate limit')
    insertReplyHeaders(res, rateLimitData)
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      insertReplyHeaders(res, e as RateLimiterRes)
      logger.info({ limit }, 'rate limit hit')
      rateLimitError(next, 'rate limit hit')
      return
    }
  }
  next()
}

export const getEntityManagerActionKey = (encodedABI: string): string => {
  const decodedABI = AudiusABIDecoder.decodeAbi('EntityManager', encodedABI)
  const action = decodedABI.get('action')
  if (action === undefined) throw new Error('action not defined in encodedABI')
  const entityType = decodedABI.get('entityType')
  if (entityType === undefined)
    throw new Error('entityType not defined in encodedABI')
  return action + entityType
}

const insertReplyHeaders = (res: Response, data: RateLimiterRes) => {
  const { msBeforeNext, remainingPoints, consumedPoints } = data
  res.header('Retry-After', (msBeforeNext / 1000).toString())
  res.header('X-RateLimit-Remaining', remainingPoints.toString())
  res.header(
    'X-RateLimit-Reset',
    new Date(Date.now() + msBeforeNext).toString()
  )
  res.header('X-RateLimit-Consumed', consumedPoints.toString())
}

const determineLimit = async (
  isUser: boolean,
  isAnonymousAllowed: boolean,
  allowList: string[],
  signer: string
): Promise<ValidLimits> => {
  if (isAnonymousAllowed) return 'app'
  const isAllowed = allowList.includes(signer)
  if (isAllowed) return 'allowlist'
  if (isUser) return 'owner'
  return 'app'
}
