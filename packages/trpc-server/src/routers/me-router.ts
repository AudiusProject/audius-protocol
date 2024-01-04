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

  playHistory: publicProcedure
    .input(
      z.object({
        sort: z
          .enum([
            'trackName',
            'artistName',
            'releaseDate',
            'playDate',
            'duration',
            'playCount',
            'repostCount',
          ])
          .default('playDate'),
        sortAscending: z.boolean().default(false),
        offset: z.number().default(0),
        limit: z.number().default(1000),
      })
    )
    .query(async ({ ctx, input }) => {
      type PlayHistoryRow = {
        artistId: number
        artistHandle: string
        artistName: string
        trackId: number
        trackName: string
        releaseDate: Date
        duration: number
        playCount: number
        repostCount: number
        playedAt: Date
      }

      const sortMapping: Record<typeof input.sort, any> = {
        trackName: sql`lower(t.title)`,
        artistName: sql`lower(a.name)`,
        releaseDate: sql`coalesce(t.release_date, t.created_at)`,
        duration: sql`t.duration`,
        playDate: sql`p.created_at`,
        playCount: sql`agg_play.count`,
        repostCount: sql`repost_count`,
      }
      const sortField = sortMapping[input.sort]
      const sortDirection = input.sortAscending ? sql`asc` : sql`desc`

      return sql`
        select
          a.user_id as artist_id,
          a.handle as artist_handle,
          a.name as artist_name,

          t.track_id,
          t.title as track_name,
          coalesce(t.release_date, t.created_at) as releaseDate,
          t.duration,

          agg_play.count as play_count,
          agg_track.repost_count,
          p.created_at as play_date

        from plays p
        join tracks t on p.play_item_id = t.track_id
        join users a on t.owner_id = a.user_id
        join aggregate_plays agg_play on p.play_item_id = agg_play.play_item_id
        join aggregate_track agg_track on p.play_item_id = agg_track.track_id

        where p.user_id = ${ctx.currentUserId!}
        order by ${sortField} ${sortDirection}
        limit ${input.limit}
        offset ${input.offset}
      ` as Promise<PlayHistoryRow[]>
    }),

  actions: publicProcedure
    .input(
      z.object({
        kind: z.string(),
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.loaders
        .actionLoaderForKind(input.kind)
        .load(parseInt(input.id))
    }),
})
