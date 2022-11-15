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
  | { isValidRequest: true; shouldCache: boolean; error: null }
  | {
      isValidRequest: false
      shouldCache: false
      error: ContentAccessError
    }
