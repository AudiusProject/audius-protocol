import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { AggregateUserRow } from '../db-tables'
import { sql } from '../db'
import { TRPCError } from '@trpc/server'

export const meRouter = router({
  userRelationship: publicProcedure
    .input(z.object({ theirId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.loaders.userRelationLoader.load(
        parseInt(input.theirId)
      )
      return result
    }),

  trackRelationship: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.loaders.trackRelationLoader.load(parseInt(input))
    }),

  playHistory: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/me/play_history' } })
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
        cursor: z.number().default(0),
        limit: z.number().default(1000),
      })
    )
    .output(
      z.array(
        z.object({
          artistId: z.number(),
          artistHandle: z.string(),
          artistName: z.string(),
          trackId: z.number(),
          routeId: z.string().nullish(),
          trackName: z.string(),
          releaseDate: z.date(),
          duration: z.number(),
          playCount: z.number(),
          repostCount: z.number(),
          playDate: z.date(),
        })
      )
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.currentUserId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }
      const sortMapping: Record<typeof input.sort, any> = {
        trackName: sql`track_name`,
        artistName: sql`artist_name`,
        releaseDate: sql`release_date`,
        duration: sql`duration`,
        playDate: sql`play_date`,
        playCount: sql`play_count`,
        repostCount: sql`repost_count`,
      }
      const sortField = sortMapping[input.sort]
      const sortDirection = input.sortAscending ? sql`asc` : sql`desc`

      return sql`
        with duped as (

          select
            a.user_id as artist_id,
            a.handle as artist_handle,
            a.name as artist_name,

            t.track_id,
            t.route_id,
            t.title as track_name,
            coalesce(t.release_date, t.created_at) as release_date,
            t.duration,

            agg_play.count as play_count,
            agg_track.repost_count,
            p.created_at as play_date,
            row_number() over (partition by p.play_item_id order by p.created_at asc) as rownum

          from plays p
          join tracks t on p.play_item_id = t.track_id
          join users a on t.owner_id = a.user_id
          join aggregate_plays agg_play on p.play_item_id = agg_play.play_item_id
          join aggregate_track agg_track on p.play_item_id = agg_track.track_id

          where p.user_id = ${ctx.currentUserId!}

        )
        select * from duped where rownum = 1
        order by ${sortField} ${sortDirection}
        limit ${input.limit}
        offset ${input.cursor || 0}
      `
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
