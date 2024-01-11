import { z } from 'zod'

import { router, publicProcedure } from '../trpc'
import type { XmlFileRow } from '../models/dbTypes'

const getUploadsInput = z.object({
  status: z
    .union([
      z.literal('success'),
      z.literal('pending'),
      z.literal('error'),
      z.literal(''),
    ])
    .optional(),
  nextId: z.string().optional(),
  prevId: z.string().optional(),
  limit: z.string().default('10'),
})
const deliveryRouter = router({
  getUploads: publicProcedure
    .input(getUploadsInput)
    .query(async ({ input, ctx }) => {
      const { status, nextId, prevId, limit } = input
      const numericLimit = Number(limit)
      const numericNextId = Number(nextId || 0)
      const numericPrevId = Number(prevId || 0)

      if (
        (nextId && isNaN(numericNextId)) ||
        (prevId && isNaN(numericPrevId)) ||
        !Number.isInteger(numericLimit)
      ) {
        throw new Error('Invalid pagination parameters.')
      }

      let statusCondition = ctx.sql`true`
      if (status) {
        statusCondition = ctx.sql`status = ${status}`
      }

      let reverseResults = false
      let cursorCondition = ctx.sql`true`
      let orderBy = ctx.sql`ORDER BY id DESC`
      if (numericNextId) {
        cursorCondition = ctx.sql`id > ${numericNextId}`
        orderBy = ctx.sql`ORDER BY id ASC`
        reverseResults = true
      } else if (numericPrevId) {
        cursorCondition = ctx.sql`id < ${numericPrevId}`
      }

      const uploads = await ctx.sql<XmlFileRow[]>`
        SELECT * FROM xml_files
        WHERE ${statusCondition}
        AND ${cursorCondition}
        ${orderBy}
        LIMIT ${numericLimit}
      `

      let hasMoreNext = false
      let hasMorePrev = false
      if (uploads.length > 0) {
        if (reverseResults) uploads.reverse()
        const maxId = uploads[0].id
        const minId = uploads[uploads.length - 1].id

        const nextSet =
          await ctx.sql`SELECT id FROM xml_files WHERE id > ${maxId} LIMIT 1`
        hasMoreNext = nextSet.length > 0

        const prevSet =
          await ctx.sql`SELECT id FROM xml_files WHERE id < ${minId} LIMIT 1`
        hasMorePrev = prevSet.length > 0
      }

      return { uploads, hasMoreNext, hasMorePrev }
    }),
})

export default deliveryRouter
