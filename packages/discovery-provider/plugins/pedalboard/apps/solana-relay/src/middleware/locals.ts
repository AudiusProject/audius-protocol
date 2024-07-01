/* eslint-disable @typescript-eslint/no-namespace */
import { Users } from '@pedalboard/storage'
import { Logger } from 'pino'

declare global {
  namespace Express {
    interface Locals {
      requestId: string
      signerUser?: Users
      isSignedByDiscovery?: boolean
      logger: Logger
      requestStartTime: number
      [k: string]: never
    }
  }
}
