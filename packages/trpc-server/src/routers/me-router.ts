import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { AggregateUserRow } from '../db-tables'
import { sql } from '../db'

export const meRouter = router({
  userRelationship: publicProcedure
    .input(z.object({ theirId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.loaders.userRelationLoader.load(
        parseInt(input.theirId)
      )
      return result
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
