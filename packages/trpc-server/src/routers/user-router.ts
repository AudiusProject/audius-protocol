import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import {
  selectPlaylistsCamel,
  selectTracksCamel,
  selectUsersCamel,
  sql
} from '../db'
import { AggregateUserTipRow } from '../db-tables'
import { publicProcedure, router } from '../trpc'

export const userRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const user = await ctx.loaders.userLoader.load(parseInt(input))
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `user ${input} not found`
      })
    }
    return user
  }),

  getTrackIds: publicProcedure.input(z.number()).query(async ({ input }) => {
    return selectTracksCamel({
      cols: ['track_id'],
      ownerId: input,
      onlyPublic: true
    })
  }),

  getPlaylistIds: publicProcedure
    .input(
      z.object({ user_id: z.number(), is_album: z.boolean().default(false) })
    )

    .query(async ({ input }) => {
      const rows = await selectPlaylistsCamel({
        cols: ['playlist_id'],
        ownerId: input.user_id,
        isAlbum: input.is_album
      })
      return rows.map((r) => r.playlistId)
    }),

  // todo: should be a "resolve to ID"
  // instead of returning full object, return ID that client can then fetch
  // for cache coherence
  byHandle: publicProcedure.input(z.string()).query(async ({ input }) => {
    const rows = await selectUsersCamel({
      handle: input
    })
    return rows[0]
  }),

  tipsSent: publicProcedure.input(z.number()).query(async ({ ctx, input }) => {
    return sql<AggregateUserTipRow[]>`
        select * from aggregate_user_tips
        where sender_user_id = ${input}
        order by amount desc
        `
  }),

  tipsReceived: publicProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      return sql<AggregateUserTipRow[]>`
        select * from aggregate_user_tips
        where receiver_user_id = ${input}
        order by amount desc
        `
    })
})
