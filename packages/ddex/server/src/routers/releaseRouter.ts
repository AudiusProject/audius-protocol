import type { ReleaseRow } from '../models/dbTypes'
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

const getReleasesInput = z.object({
  status: z
    .union([
      z.literal('success'),
      z.literal('processing'),
      z.literal('error'),
      z.literal(''),
    ])
    .optional(),
  nextCursor: z.string().optional(),
  prevCursor: z.string().optional(),
  limit: z.string().default('10'),
})

const releaseRouter = router({
  getReleases: publicProcedure
    .input(getReleasesInput)
    .query(async ({ input, ctx }) => {
      const { status, nextCursor, prevCursor, limit } = input
      const numericLimit = Number(limit)

      if (!Number.isInteger(numericLimit)) {
        throw new Error('Invalid limit.')
      }

      let statusCondition = ctx.sql`true`
      if (status) {
        statusCondition = ctx.sql`status = ${status}`
      }

      let reverseResults = false
      let cursorCondition = ctx.sql`true`
      let orderBy = ctx.sql`ORDER BY release_date DESC, id DESC`
      if (nextCursor && typeof nextCursor === 'string') {
        const [nextDate, nextId] = nextCursor.split(',')
        cursorCondition = ctx.sql`(release_date, id) > (${nextDate}, ${nextId})`
        orderBy = ctx.sql`ORDER BY release_date ASC, id ASC`
        reverseResults = true
      } else if (prevCursor && typeof prevCursor === 'string') {
        const [prevDate, prevId] = prevCursor.split(',')
        cursorCondition = ctx.sql`(release_date, id) < (${prevDate}, ${prevId})`
      }

      const releases = await ctx.sql<ReleaseRow[]>`
        SELECT * FROM releases
        WHERE ${statusCondition}
        AND ${cursorCondition}
        ${orderBy}
        LIMIT ${numericLimit}
      `

      let hasMoreNext = false
      let hasMorePrev = false
      if (releases.length > 0) {
        if (reverseResults) releases.reverse()
        const maxRelease = releases[0]
        const minRelease = releases[releases.length - 1]

        const nextSet =
          await ctx.sql`SELECT id FROM releases WHERE (release_date, id) > (${maxRelease.release_date}, ${maxRelease.id}) LIMIT 1`
        hasMoreNext = nextSet.length > 0

        const prevSet =
          await ctx.sql`SELECT id FROM releases WHERE (release_date, id) < (${minRelease.release_date}, ${minRelease.id}) LIMIT 1`
        hasMorePrev = prevSet.length > 0
      }

      return { releases, hasMoreNext, hasMorePrev }
    }),
})

export default releaseRouter
