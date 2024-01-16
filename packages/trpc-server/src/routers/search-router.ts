import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { Client as ES } from '@elastic/elasticsearch'

export const esc = new ES({ node: process.env.audius_elasticsearch_url })

export const searchRouter = router({
  users: publicProcedure
    .input(
      z.object({
        q: z.string(),
        onlyFollowed: z.boolean().default(false),
        limit: z.number().default(20),
        cursor: z.string().default('0'),
      })
    )
    .query(async ({ ctx, input }) => {
      const followedBy = input.onlyFollowed ? ctx.currentUserId : undefined
      const found = await esc.search({
        index: 'users',
        query: userSearchDSL(input.q, followedBy) as any,
        _source: false,
      })
      const ids = found.hits.hits.map((h) => h._id)
      return ids
    }),

  tracks: publicProcedure
    .input(
      z.object({
        q: z.string(),
        onlySaved: z.boolean().default(false),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const savedBy = input.onlySaved ? ctx.currentUserId : undefined
      const found = await esc.search({
        index: 'tracks',
        query: trackSearchDSL(input.q, savedBy) as any,
        _source: false,
      })
      const ids = found.hits.hits.map((h) => h._id)
      return ids
    }),
})

export function userSearchDSL(q: string, followedBy?: number) {
  const dsl: any = {
    bool: {
      must: [suggestDSL(q), { term: { is_deactivated: { value: false } } }],
      must_not: [{ exists: { field: 'stem_of' } }],
      should: [],
    },
  }

  if (followedBy) {
    dsl.bool.must.push({
      terms: {
        _id: {
          index: 'users',
          id: followedBy.toString(),
          path: 'following_ids',
        },
      },
    })
  }

  return dsl
}

function trackSearchDSL(q: string, savedByUserId?: number) {
  const dsl: any = {
    bool: {
      must: [
        suggestDSL(q),
        { term: { is_unlisted: { value: false } } },
        { term: { is_delete: false } },
      ],
      must_not: [],
      should: [{ term: { is_verified: { value: true } } }],
    },
  }

  if (savedByUserId) {
    dsl.bool.must.push({
      term: { saved_by: { value: savedByUserId, boost: 1.2 } },
    })
  }

  return dsl
}

function suggestDSL(
  q: string,
  operator: string = 'or',
  extraFields: string[] = []
) {
  return {
    multi_match: {
      query: q,
      fields: ['suggest', 'suggest._2gram', 'suggest._3gram', ...extraFields],
      operator: operator as any,
      type: 'bool_prefix',
      fuzziness: 'AUTO',
    },
  }
}
