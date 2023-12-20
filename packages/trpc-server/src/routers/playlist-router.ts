import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { esc } from './search-router'

export const playlistRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const row = await ctx.loaders.playlistLoader.load(parseInt(input))
    if (!row) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    return row
  }),

  containTrackId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const found = await esc.search({
        index: 'playlists',
        query: {
          bool: {
            must: [
              { term: { 'playlist_contents.track_ids.track': input } },
              { term: { is_delete: false } },
              { term: { is_private: false } },
            ],
            must_not: [],
            should: [],
          },
        },
        _source: false,
      })
      return found.hits.hits.map((h) => h._id)
    }),
})
