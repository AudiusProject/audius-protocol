import { useQuery } from '@tanstack/react-query'

import { trendingIdsFromSDK } from '~/adapters/trending'
import { useAudiusQueryContext } from '~/audius-query'
import { ID } from '~/models/Identifiers'

import { QUERY_KEYS } from './queryKeys'

type GetTrendingIdsArgs = {
  genre?: string
}

const messages = {
  year: 'Year',
  month: 'Month',
  week: 'Week'
}

export const getTrendingIdsQueryKey = (args?: GetTrendingIdsArgs) => [
  QUERY_KEYS.trendingIds,
  { genre: args?.genre }
]

/**
 * Hook that returns trending track IDs for all time periods
 */
export const useGetTrendingIds = (args?: GetTrendingIdsArgs) => {
  const { audiusSdk } = useAudiusQueryContext()
  return useQuery({
    queryKey: getTrendingIdsQueryKey(args),
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
