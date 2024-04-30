import { Binary, ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import { z } from 'zod'

import { router, publicProcedure } from '../trpc'

import { makeListCollection } from './helpers'

const RELEASES_COLLECTION = 'releases'

const releasesRouter = router({
  getReleases: makeListCollection(RELEASES_COLLECTION),
  getXML: publicProcedure
    .input(
      z.object({
        id: z.string()
      })
    )
    .query(async ({ input }) => {
      const document = await mongoose.connection.db
        .collection(RELEASES_COLLECTION)
        .findOne(
          { _id: input.id as unknown as ObjectId },
          { projection: { raw_xml: 1 } } // Only return the raw_xml field
        )

      if (document && document.raw_xml instanceof Binary) {
        const xmlString = document.raw_xml.buffer.toString()
        return { raw_xml: xmlString }
      }

      return { raw_xml: null }
    }),
  getDoc: publicProcedure
    .input(
      z.object({
        id: z.string()
      })
    )
    .query(async ({ input }) => {
      const document = await mongoose.connection.db
        .collection(RELEASES_COLLECTION)
        .findOne(
          { _id: input.id as unknown as ObjectId },
          { projection: { raw_xml: 0 } } // Exclude the raw_xml field
        )

      return { document }
    }),
  reprocessAllReleases: publicProcedure.mutation(async () => {
    return await mongoose.connection.db
      .collection('releases')
      .updateMany({}, { $set: { release_status: 'awaiting_parse' } })
  }),
  reprocessErroredReleases: publicProcedure.mutation(async () => {
    return await mongoose.connection.db
      .collection('releases')
      .updateMany(
        { parse_errors: { $exists: true, $not: { $size: 0 } } },
        { $set: { release_status: 'awaiting_parse' } }
      )
  })
})

export default releasesRouter
