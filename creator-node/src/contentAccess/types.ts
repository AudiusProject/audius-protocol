import type Logger from 'bunyan'
import { Redis } from 'ioredis'

export type ContentSignatureData = {
  cid: string
  timestamp: number
}

export type ContentAccessError =
  | 'MissingHeaders'
  | 'InvalidDiscoveryNode'
  | 'IncorrectCID'
  | 'ExpiredTimestamp'

export type CheckAccessArgs = {
  cid: string
  contentAccessHeaders: string
  libs: any
  logger: Logger
  redis: Redis
}

export type CheckAccessResponse =
  | { doesUserHaveAccess: true; error: null }
  | {
      doesUserHaveAccess: false
      error: ContentAccessError
    }
