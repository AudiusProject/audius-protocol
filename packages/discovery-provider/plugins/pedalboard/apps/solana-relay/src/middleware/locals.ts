import { Users } from '@pedalboard/storage'
import { Logger } from 'pino'

declare global {
  namespace Express {
    interface Locals {
      signerUser?: Users
      isSignedByDiscovery?: boolean
      isSignedByContent?: boolean
      logger: Logger
      requestStartTime: number
      [k: string]: never
    }
  }
}
