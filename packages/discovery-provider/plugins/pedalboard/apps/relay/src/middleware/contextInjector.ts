import { Users } from '@pedalboard/storage'
import { ValidatedRelayRequest } from '../types/relay'

/** Context built by the context injector that can be referenced later in the request (via response object). */
export interface RequestContext {
  startTime: Date
  recoveredSigner: Users
  isApp: boolean
  ip: string
  requestId: string
  validatedRelayRequest: ValidatedRelayRequest
}

declare global {
  namespace Express {
    interface Locals {
      ctx: RequestContext
    }
  }
}
