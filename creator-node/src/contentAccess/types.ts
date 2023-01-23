import type Logger from 'bunyan'
import { Redis } from 'ioredis'

export type ContentSignatureData = {
  cid: string
  timestamp: number
}

export type ContentAccessError =
  | 'InvalidDiscoveryNode'
  | 'IncorrectCID'
  | 'ExpiredTimestamp'

export type CheckAccessArgs = {
  cid: string
  data: SignedData
  signature: string
  libs: any
  logger: Logger
  redis: Redis
}

export type SignedData = {
  cid: string
  timestamp: number
  shouldCache: boolean
  trackId: number
}

export type CheckAccessResponse =
  | { isValidRequest: true; trackId: number; shouldCache: boolean; error: null }
  | {
      isValidRequest: false
      shouldCache: false
      error: ContentAccessError
    }
