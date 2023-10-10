import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { Client as ES } from '@elastic/elasticsearch'

const url = process.env.audius_elasticsearch_url || 'http://elasticsearch:9200'
const esc = new ES({ node: url })

export const searchRouter = router({
  suggest: publicProcedure
    .input(
      z.object({
        q: z.string(),
        limit: z.number().default(20),
        cursor: z.string().or(z.number()).default(0)
      })
    )
    .query(async ({ ctx, input }) => {
      const searches = []

      const baseQuery = {
        query: {
          multi_match: {
            query: input.q,
            fields: ['suggest', 'suggest._2gram', 'suggest._3gram'],
            operator: 'or',
            type: 'bool_prefix',
            fuzziness: 'AUTO'
          }
        }
      }

      function functionScore(query: any, rankingField: string) {
        return {
          query: {
            script_score: {
              ...query,
              script: {
                source: `_score * Math.log(Math.max(doc['${rankingField}'].value, 0) + 2)`
              }
            }
          },
          _source: false,
          size: input.limit,
          from: input.cursor
        }
      }

      searches.push({ index: 'users' })
      searches.push(functionScore(baseQuery, 'follower_count'))

      searches.push({ index: 'tracks' })
      searches.push(functionScore(baseQuery, 'repost_count'))

      searches.push({ index: 'playlists' })
      searches.push(functionScore(baseQuery, 'repost_count'))

      const results = await esc.msearch({
        searches: searches as any
      })

      const [users, tracks, playlists] = results.responses.map(pluckIds)

      return {
        users,
        tracks,
        playlists
      }
    })
})

function pluckIds(x: any): number[] {
  return x.hits.hits.map((h: any) => parseInt(h._id))
}
