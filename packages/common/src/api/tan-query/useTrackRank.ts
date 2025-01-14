import { useQuery } from '@tanstack/react-query'

import { trendingIdsFromSDK } from '~/adapters/trending'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

type GetTrendingIdsArgs = {
  genre?: string
}

const TRENDING_IDS_QUERY_KEY = 'TRENDING_IDS'

const messages = {
  year: 'Year',
  month: 'Month',
  week: 'Week'
}

/**
 * Hook that returns trending track IDs for all time periods
 */
export const useGetTrendingIds = (args?: GetTrendingIdsArgs) => {
  const { audiusSdk } = useAudiusQueryContext()
  return useQuery({
    queryKey: [TRENDING_IDS_QUERY_KEY, args],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.tracks.getTrendingTrackIDs(args)
      return data ? trendingIdsFromSDK(data) : null
    }
  })
}

/**
 * Hook that returns the best rank for a track ID from trending data.
 * Checks ranks in order: year -> month -> week
 * @param trackId The track ID to check
 * @returns The best rank (1-based) or undefined if not found in any trending list
 */
export const useTrackRank = (trackId: ID) => {
  const { data: trendingIds } = useGetTrendingIds()

  if (!trendingIds) return undefined

  // Check year first (closest to all-time)
  const yearRank = trendingIds.year?.findIndex((yearId) => yearId === trackId)
  if (yearRank !== -1 && yearRank !== undefined)
    return `#${yearRank + 1} this ${messages.year}`

  // Check month next
  const monthRank = trendingIds.month?.findIndex(
    (monthId) => monthId === trackId
  )
  if (monthRank !== -1 && monthRank !== undefined)
    return `#${monthRank + 1} this ${messages.month}`

  // Check week last
  const weekRank = trendingIds.week?.findIndex((weekId) => weekId === trackId)
  if (weekRank !== -1 && weekRank !== undefined)
    return `#${weekRank + 1} this ${messages.week}`

  return undefined
}
