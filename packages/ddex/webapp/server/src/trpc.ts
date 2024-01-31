import { initTRPC } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'

// created for each request
// TODO: add context auth
export type CustomContext = Record<string, never>

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
