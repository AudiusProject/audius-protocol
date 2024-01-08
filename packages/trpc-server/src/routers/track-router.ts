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
    .input(
      z.object({
        trackId: z.number(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      return sql`
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
      ` as Promise<TopListenerRow[]>
    }),
})

type TopListenerRow = UserRow & {
  playCount: number
}
