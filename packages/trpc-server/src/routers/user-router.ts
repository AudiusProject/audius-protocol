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
      return null;
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
    }),

  // ======== list of user IDs
  listUserIds: publicProcedure
    .input(
      z.object({
        verb: z.enum([
          'follow',
          'followedBy',
          'mutualFollows',
          'saved',
          'reposted'
        ]),
        kind: z.enum(['user', 'track', 'playlist']),
        id: z.string(),
        limit: z.number().default(20),
        // tRPC says cursor can be a number,
        // but inferred type on client wants a string...
        // so use a string here since it's ok either way
        cursor: z.string().default('0')
      })
    )
    .output(
      z.object({
        count: z.number(),
        ids: z.number().array()
      })
    )
    .query(async ({ ctx, input }) => {
      let subquery = sql`select`
      const kinds = input.kind === 'track' ? ['track'] : ['playlist', 'album']

      switch (input.verb) {
        case 'follow':
          subquery = sql`
            select follower_user_id
            from follows
            where is_delete = false
              and followee_user_id = ${input.id}`
          break

        case 'followedBy':
          subquery = sql`
            select followee_user_id
            from follows
            where is_delete = false
              and follower_user_id = ${input.id}`
          break

        case 'mutualFollows':
          const myId = ctx.currentUserId || 0
          subquery = sql`
            select followee_user_id from follows where is_delete = false and follower_user_id = ${myId}
            intersect
            select followee_user_id from follows where is_delete = false and follower_user_id = ${input.id}`
          break

        case 'reposted':
          subquery = sql`
            select user_id
            from reposts
            where is_delete = false
              and repost_type in ${sql(kinds)}
              and repost_item_id = ${input.id}`
          break

        case 'saved':
          subquery = sql`
            select user_id
            from saves
            where is_delete = false
              and save_type in ${sql(kinds)}
              and save_item_id = ${input.id}`
          break
      }

      const rows = await sql<IdWithTotalCountRow[]>`
        select
          count(*) OVER() AS count,
          user_id as id
        from aggregate_user u
        where
        user_id in (${subquery})
        order by follower_count desc
        limit ${input.limit}
        offset ${input.cursor}
      `

      const count = rows[0]?.count || 0
      const ids = rows.map((row) => row.id)
      return {
        count,
        ids
      }
    })
})

type IdWithTotalCountRow = {
  count: number
  id: number
}
