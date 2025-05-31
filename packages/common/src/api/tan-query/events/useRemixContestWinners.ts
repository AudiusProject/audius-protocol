import { useMemo } from 'react'

import { ID } from '~/models'

import { useTracks } from '../tracks/useTracks'
import { QueryOptions } from '../types'

import { useRemixContest } from './useRemixContest'

/**
 * Hook that returns the track IDs of winners for a remix contest.
 * Uses useTracks internally to pre-fetch the winner tracks into the cache.
 * @param trackId The ID of the track that has the remix contest
 * @param options Query options
 * @returns The winner track IDs and loading states
 */
export const useRemixContestWinners = (
  trackId: number | null | undefined,
  options?: QueryOptions
) => {
  // Get the remix contest data
  const { data: remixContest, isLoading: isContestLoading } = useRemixContest(
    trackId,
    {
      // Only enable if we have a trackId
      enabled: options?.enabled !== false && !!trackId
    }
  )

  // Extract winner IDs from contest data
  const winnerIds = useMemo(
    () => remixContest?.eventData?.winners ?? [],
    [remixContest?.eventData?.winners]
  )

  // Pre-fetch the winner tracks into the cache
  const {
    isLoading: isTracksLoading,
    isPending: isTracksPending,
    isFetching: isTracksFetching
  } = useTracks(winnerIds, {
    // Only enable if we have winner IDs
    enabled: options?.enabled !== false && winnerIds.length > 0
  })

  return {
    // Return the winner IDs
    data: winnerIds as ID[],
    // Consider loading if either the contest or tracks are loading
    isLoading: isContestLoading || isTracksLoading,
    // Consider pending if either the contest or tracks are pending
    isPending: isContestLoading || isTracksPending,
    // Consider fetching if either the contest or tracks are fetching
    isFetching: isContestLoading || isTracksFetching
  }
}
