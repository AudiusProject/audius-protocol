import { logger } from '../logger'
import { RelayRateLimiter, ValidLimits } from '../config/rateLimitConfig'
import { Knex } from 'knex'
import { AudiusABIDecoder } from '@audius/sdk'
import { RateLimiterRes } from 'rate-limiter-flexible'
import { Table, Users } from '@pedalboard/storage'
import { config, discoveryDb } from '..'
import { NextFunction, Request, Response, response } from 'express'
import { rateLimitError } from '../error'

const globalRateLimiter = new RelayRateLimiter()

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { validatedRelayRequest, recoveredSigner } = res.locals.ctx
  const { encodedABI } = validatedRelayRequest

  const signer = recoveredSigner.wallet
  if (signer === undefined || signer === null) {
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
    recoveredSigner,
    config.rateLimitAllowList,
    signer
  )
  logger.info({ limit })

  try {
    const res = await globalRateLimiter.consume({
      operation,
      signer,
      limit
    })
    insertReplyHeaders(response, res)
  } catch (e) {
    if (e instanceof RateLimiterRes) {
      insertReplyHeaders(response, e as RateLimiterRes)
      rateLimitError(next, 'rate limit hit')
      return
    }
  }
  next()
}

const getEntityManagerActionKey = (encodedABI: string): string => {
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
  user: Users,
  allowList: string[],
  signer: string
): Promise<ValidLimits> => {
  const isAllowed = allowList.includes(signer)
  if (isAllowed) return 'allowlist'
  logger.info({ user, signer })
  if (user !== undefined) return 'owner'
  return 'app'
}
