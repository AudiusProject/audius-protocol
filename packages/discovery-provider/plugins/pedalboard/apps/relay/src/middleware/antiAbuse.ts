import axios from 'axios'
import { Users } from '@pedalboard/storage'
import { AntiAbuseConfig } from '../config/antiAbuseConfig'
import { logger } from '../logger'
import { NextFunction, Request, Response } from 'express'
import { config } from '..'
import { antiAbuseError, internalError } from '../error'

type AbuseRule = {
  rule: number
  trigger: boolean
  action: 'pass' | 'fail'
}

type AbuseStatus = {
  blockedFromRelay: boolean
  blockedFromNotifications: boolean
  blockedFromEmails: boolean
  appliedRules: number[] | null
}

export const antiAbuseMiddleware = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const aaoConfig = config.aao
  const { ip, recoveredSigner: user } = response.locals.ctx
  await detectAbuse(aaoConfig, user, ip, false, next)
}

export const detectAbuse = async (
  aaoConfig: AntiAbuseConfig,
  user: Users,
  reqIp: string,
  abbreviated: boolean,
  next: NextFunction
) => {
  // if aao turned off, never detect abuse
  if (!aaoConfig.useAao || !user.handle) {
    next()
    return
  }
  let rules: AbuseRule[]
  try {
    rules = await requestAbuseData(aaoConfig, user.handle, reqIp, false)
  } catch (e) {
    logger.warn({ e }, 'error returned from antiabuse oracle')
    // block requests on issues with aao
    internalError(next, 'AAO unreachable')
    return
  }
  const {
    appliedRules,
    blockedFromRelay,
    blockedFromNotifications,
    blockedFromEmails
  } = determineAbuseRules(aaoConfig, rules)
  logger.info(
    `detectAbuse: got info for handle ${user.handle}: ${JSON.stringify({
      appliedRules,
      blockedFromRelay,
      blockedFromNotifications,
      blockedFromEmails
    })}`
  )
  if (blockedFromRelay) {
    antiAbuseError(next, 'blocked from relay')
    return
  }
  next()
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
