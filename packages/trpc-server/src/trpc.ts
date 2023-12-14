import { TRPCError, initTRPC } from '@trpc/server'
import { prepareLoaders } from './loaders'
import { OpenApiMeta } from 'trpc-openapi'

export type Context = typeof createContext

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create()

// some less public procedures
const requiresCurrentUserIdHeader = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx } = opts
    if (!ctx.currentUserId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return opts.next({
      ctx
    })
  })
)

export async function createContext(opts: any) {
  let currentUserId: number | undefined = undefined
  if (opts.req.headers['x-current-user-id']) {
    currentUserId = parseInt(opts.req.headers['x-current-user-id'])
  } else if (opts.req.query['currentUserId']) {
    currentUserId = parseInt(opts.req.query['currentUserId'])
  }
  const loaders = prepareLoaders(currentUserId)
  return { currentUserId, loaders }
}

export const publicProcedure = t.procedure
export const router = t.router
