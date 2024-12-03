import axios from 'axios'
import { Users } from '@pedalboard/storage'
import { AntiAbuseConfig } from '../config/antiAbuseConfig'
import { NextFunction, Request, Response } from 'express'
import { config } from '..'
import { antiAbuseError, internalError } from '../error'
import { readAAOState, storeAAOState } from '../redis'
import { unknownToError } from '../utils'
import pino from 'pino'

type AbuseRule = {
  rule: number
  trigger: boolean
  action: 'pass' | 'fail'
}

export type AbuseStatus = {
  blockedFromRelay: boolean
  blockedFromNotifications: boolean
  blockedFromEmails: boolean
  appliedRules: number[] | null
}

export const antiAbuseMiddleware = async (
  _: Request,
  response: Response,
  next: NextFunction
) => {
  const aaoConfig = config.aao
  const {
    ip,
    recoveredSigner,
    signerIsApp,
    isAnonymousAllowed,
    isSenderVerifier,
    logger
  } = response.locals.ctx

  // no AAO to check and creates / deactivates should always be allowed
  if (signerIsApp || isAnonymousAllowed || isSenderVerifier) {
    logger.info({ isAnonymousAllowed, isSenderVerifier }, 'antiabuse skipped')
    next()
    return
  }
  const user = recoveredSigner as Users

  // fire and async update aao cache
  detectAbuse(aaoConfig, logger, user, ip).catch((e) => {
    logger.error({ error: e }, 'AAO uncaught exception')
  })

  if (user.handle) {
    // read from cache and determine if blocked from relay
    const userAbuseRules = await readAAOState(user.handle)
    if (userAbuseRules === null) {
      // first relay, allow passage
      next()
      return
    }

    if (userAbuseRules?.blockedFromRelay) {
      logger.info(`blocked from relay ${user.handle_lc}`)
      antiAbuseError(next, 'blocked from relay')
      return
    }
  }

  // relay allowed from AAO perspective, advance forward
  next()
}

// detects abuse for the queried user and stores in cache
export const detectAbuse = async (
  aaoConfig: AntiAbuseConfig,
  logger: pino.Logger,
  user: Users,
  reqIp: string
) => {
  // if AAO is off or we don't yet have a handle, skip detecting abuse
  if (!aaoConfig.useAao || !user.handle) {
    return
  }
  let rules: AbuseRule[]
  try {
    rules = await requestAbuseData(aaoConfig, user.handle, reqIp, false)
  } catch (e) {
    const aaoError = unknownToError(e)
    logger.error(
      {
        handle: user.handle_lc,
        userId: user.user_id,
        address: user.wallet,
        error: aaoError.message,
        errorStackTrace: aaoError.stack
      },
      'error returned from anti abuse oracle'
    )
    return
  }
  const userAbuseRules = determineAbuseRules(aaoConfig, rules)
  const {
    appliedRules,
    blockedFromRelay,
    blockedFromNotifications,
    blockedFromEmails
  } = userAbuseRules
  logger.info(
    `detectAbuse: got info for handle ${user.handle}: ${JSON.stringify({
      appliedRules,
      blockedFromRelay,
      blockedFromNotifications,
      blockedFromEmails
    })}`
  )
  storeAAOState(user.handle, userAbuseRules)
}

// makes HTTP request to AAO
const requestAbuseData = async (
  aaoConfig: AntiAbuseConfig,
  handle: string,
  reqIp: string,
  abbreviated: boolean
): Promise<AbuseRule[]> => {
  const { antiAbuseOracleUrl } = aaoConfig
  const res = await axios.get<AbuseRule[]>(
    `${antiAbuseOracleUrl}/abuse/${handle}${
      abbreviated ? '?abbreviated=true' : ''
    }`,
    {
      headers: {
        'X-Forwarded-For': reqIp
      }
    }
  )

  return res.data
}

// takes response from AAO and determines abuse status
const determineAbuseRules = (
  aaoConfig: AntiAbuseConfig,
  rules: AbuseRule[]
): AbuseStatus => {
  const {
    allowRules,
    blockRelayAbuseErrorCodes,
    blockNotificationsErrorCodes,
    blockEmailsErrorCodes
  } = aaoConfig
  const appliedSuccessRules = rules
    .filter((r) => r.trigger && r.action === 'pass')
    .map((r) => r.rule)
  const allowed = appliedSuccessRules.some((r) => allowRules.has(r))

  if (allowed) {
    return {
      blockedFromRelay: false,
      blockedFromNotifications: false,
      blockedFromEmails: false,
      appliedRules: null
    }
  }

  const appliedFailRules = rules
    .filter((r) => r.trigger && r.action === 'fail')
    .map((r) => r.rule)

  const blockedFromRelay = appliedFailRules.some((r) =>
    blockRelayAbuseErrorCodes.has(r)
  )
  const blockedFromNotifications = appliedFailRules.some((r) =>
    blockNotificationsErrorCodes.has(r)
  )
  const blockedFromEmails = appliedFailRules.some((r) =>
    blockEmailsErrorCodes.has(r)
  )

  return {
    blockedFromRelay,
    blockedFromNotifications,
    blockedFromEmails,
    appliedRules: appliedFailRules
  }
}
