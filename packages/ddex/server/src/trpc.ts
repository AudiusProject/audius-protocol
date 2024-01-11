/* eslint-disable @typescript-eslint/no-unused-vars */
import { AudiusSdk } from '@audius/sdk'
import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import { Sql } from 'postgres'
import { ScheduledReleaseService } from './services/scheduledReleaseService'
import { XmlProcessorService } from './services/xmlProcessorService'

// created for each request
// TODO: add context for db and auth

export type CustomContext = {
  sql: Sql
  audiusSdk: AudiusSdk
  xmlProcessorService: XmlProcessorService
  scheduledReleaseService: ScheduledReleaseService
}

export function createContext(
  options: trpcExpress.CreateExpressContextOptions,
  customContext: CustomContext
) {
  return {
    req: options.req,
    res: options.res,
    ...customContext,
  }
}

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
