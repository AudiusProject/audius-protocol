import { DeveloperApps, Users } from '@pedalboard/storage'
import { ValidatedRelayRequest } from '../types/relay'
import pino from 'pino'

/** Context built by the context injector that can be referenced later in the request (via response object). */
export interface RequestContext {
  startTime: Date
  ip: string
  requestId: string
  validatedRelayRequest: ValidatedRelayRequest

  // using these booleans is clearer than
  // writing a js property validator
  recoveredSigner: Users | DeveloperApps
  signerIsApp: boolean
  signerIsUser: boolean
  isAnonymousAllowed: boolean
  isSenderVerifier: boolean
  logger: pino.Logger
}

declare global {
  namespace Express {
    interface Locals {
      ctx: RequestContext
    }
  }
}
