import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const meRouter = router({
  userRelationship: publicProcedure
    .input(z.object({ theirId: z.string() }))
    .output(z.object({ followed: z.boolean(), followsMe: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return ctx.loaders.userRelationLoader.load(parseInt(input.theirId))
    })
})
