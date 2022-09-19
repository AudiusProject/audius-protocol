import type Logger from 'bunyan'
import { Redis } from 'ioredis'

export type PremiumContentType = 'track'

export type PremiumContentSignatureData = {
  premium_content_id: number
  premium_content_type: PremiumContentType
  user_wallet: string
  timestamp: number
}

export enum PremiumContentAccessError {
  MISSING_HEADERS = 'MISSING_HEADERS',
  INVALID_DISCOVERY_NODE = 'INVALID_DISCOVERY_NODE',
  FAILED_MATCH = 'FAILED_MATCH'
}

export type CheckAccessArgs = {
  cid: string
  premiumContentHeaders: string
  libs: any
  logger: Logger
  redis: Redis
}

export type CheckAccessResponse =
  | { doesUserHaveAccess: true; trackId: null; isPremium: false; error: null }
  | {
      doesUserHaveAccess: true
      trackId: number
      isPremium: boolean
      error: null
    }
  | {
      doesUserHaveAccess: false
      trackId: number
      isPremium: true
      error: PremiumContentAccessError
    }
