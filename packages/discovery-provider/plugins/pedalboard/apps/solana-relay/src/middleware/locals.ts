import { Users } from '@pedalboard/storage'
import { Logger } from 'pino'

declare global {
  namespace Express {
    interface Locals {
      signer?: Users
      logger: Logger
      requestStartTime: number
      [k: string]: never
    }
  }
}
