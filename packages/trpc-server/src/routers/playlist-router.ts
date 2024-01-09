import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { esc } from './search-router'
import { PlaylistRow } from '../db-tables'

export type PlaylistRouteData = {
  playlist_id: number
  name: string
  permalink: string
  artist_id: number
}

export const playlistRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const row = await ctx.loaders.playlistLoader.load(parseInt(input))
    if (!row) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    return row
  }),
})
