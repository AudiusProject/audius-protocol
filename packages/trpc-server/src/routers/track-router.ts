import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { TRPCError } from '@trpc/server'
import { sql } from '../db'
import { UserRow } from '../db-tables'

export const trackRouter = router({
  get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const row = await ctx.loaders.trackLoader.load(parseInt(input))
    if (!row) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    return row
  }),

  topListeners: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/tracks/top_listeners' } })
    .input(
      z.object({
        trackId: z.number(),
        limit: z.number().default(100),
      })
    )
    .output(z.array(z.custom<TopListenerRow>()))
    .query(async ({ ctx, input }) => {
      const rows: TopListenerRow[] = await sql`
        with
        deduped as (
          select distinct play_item_id, user_id, date_trunc('hour', created_at) as created_at
          from plays
          where user_id is not null
            and play_item_id = ${input.trackId}
        ),
        counted as (
          select user_id, count(*) as play_count
          from deduped
          group by 1
        )
        select *
        from counted
        join users u using (user_id)
        order by play_count desc
        limit ${input.limit}
      `

      // remove some needless user fields
      // this could also be done with output validator
      // or we could just return (userId, playCount)
      // and client can fetch user rows...
      rows.forEach((r) => {
        delete r.playlistLibrary
        delete r.primaryId
        delete r.secondaryIds
        delete r.creatorNodeEndpoint
      })

      return rows
    }),
})

type TopListenerRow = UserRow & {
  playCount: number
}
