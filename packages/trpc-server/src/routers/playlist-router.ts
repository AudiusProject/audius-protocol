import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

export const playlistRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const row = await ctx.loaders.playlistLoader.load(parseInt(input))
    if (!row) {
      return null;
    }
    return row
  }),
})
