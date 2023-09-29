import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const meRouter = router({
  userRelationship: publicProcedure
    .input(z.object({ theirId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.loaders.userRelationLoader.load(parseInt(input.theirId))
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
