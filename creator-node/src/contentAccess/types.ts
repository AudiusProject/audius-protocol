import type Logger from 'bunyan'
import { Redis } from 'ioredis'

export type contentSignatureData = {
  cid: string
  timestamp: number
}

export type contentAccessError =
  | 'MissingHeaders'
  | 'InvalidDiscoveryNode'
  | 'IncorrectCID'
  | 'ExpiredTimestamp'

export type CheckAccessArgs = {
  cid: string
  premiumContentHeaders: string
  libs: any
  logger: Logger
  redis: Redis
}

export type CheckAccessResponse =
  | { doesUserHaveAccess: true; error: null }
  | {
      doesUserHaveAccess: false
      error: contentAccessError
    }
