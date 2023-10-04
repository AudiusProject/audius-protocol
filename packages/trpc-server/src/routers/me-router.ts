import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const meRouter = router({
  userRelationship: publicProcedure
    .input(
      z.union([
        // prefer calling with single argument
        z.string(),
        // todo: remove this when client no longer using the theirId argument
        z.object({ theirId: z.string() })
      ])
    )
    .query(async ({ ctx, input }) => {
      const theirId = typeof input == 'string' ? input : input.theirId
      return ctx.loaders.userRelationLoader.load(parseInt(theirId))
    }),

  actions: publicProcedure
    .input(
      z.object({
        kind: z.string(),
        id: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.loaders
        .actionLoaderForKind(input.kind)
        .load(parseInt(input.id))
    })
})
