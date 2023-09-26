import { z } from 'zod'
import {
  selectTracksCamel,
  selectPlaylistsCamel,
  selectUsersCamel,
  sql
} from '../db'
import { UserRow, AggregateUserRow, AggregateUserTipRow } from '../db-tables'
import { publicProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'

export const userRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.loaders.userLoader.load(parseInt(input))
  }),

  getMany: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/users/getMany',
        tags: ['users'],
        summary: 'Get users by id'
      }
    })
    .input(
      z.object({
        id: z.string()
      })
    )
    .output(z.array(z.any()))
    .query(async ({ ctx, input }) => {
      const ids = input.id.split(',').map((x) => parseInt(x) || 0)
      const hits = await ctx.loaders.userLoader.loadMany(ids)
      return hits
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

  // todo: should not return full User records
  byHandle: publicProcedure.input(z.string()).query(async ({ input }) => {
    const rows = await selectUsersCamel({
      handle: input
    })
    return rows[0]
  }),

  myRelation: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/users/relationship',
        tags: ['users'],
        summary: 'Get bi-directional follow relationship'
      }
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ followed: z.boolean(), followsMe: z.boolean() }))
    .query(async ({ ctx, input }) => {
      return ctx.loaders.userRelationLoader.load(input.id)
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
