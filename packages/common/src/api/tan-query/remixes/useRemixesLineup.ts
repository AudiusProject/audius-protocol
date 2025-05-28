import { useEffect, useMemo } from 'react'

import { EntityType } from '@audius/sdk'
import { useDispatch } from 'react-redux'

import { useRemixContestWinners } from '~/api/tan-query/events/useRemixContestWinners'
import { PlaybackSource } from '~/models/Analytics'
import {
  remixesPageLineupActions,
  remixesPageSelectors,
  remixesPageActions
} from '~/store/pages'

import { useLineupQuery } from '../lineups/useLineupQuery'
import { LineupData, QueryOptions } from '../types'

import { UseRemixesArgs, useRemixes, getRemixesQueryKey } from './useRemixes'

const DEFAULT_PAGE_SIZE = 10

export const useRemixesLineup = (
  {
    trackId,
    includeOriginal = false,
    includeWinners = false,
    pageSize = DEFAULT_PAGE_SIZE,
    sortMethod = 'recent',
    isCosign = false,
    isContestEntry = false
  }: UseRemixesArgs,
  options?: QueryOptions
) => {
  const dispatch = useDispatch()

  // Get winner IDs
  const { data: winnerIds, isLoading: isWinnersLoading } =
    useRemixContestWinners(trackId, {
      enabled: options?.enabled !== false && includeWinners
    })

  useEffect(() => {
    if (trackId) {
      dispatch(remixesPageActions.fetchTrackSucceeded({ trackId }))
    }
  }, [dispatch, trackId])

  // Use the core remixes fetching logic
  const queryData = useRemixes(
    {
      trackId,
      includeOriginal,
      includeWinners,
      pageSize,
      sortMethod,
      isCosign,
      isContestEntry
    },
    {
      ...options,
      enabled:
        options?.enabled !== false &&
        !!trackId &&
        (!includeWinners || !isWinnersLoading)
    }
  )

  // Process and order the lineup data
  const processedLineupData = useMemo(() => {
    const remixTracks =
      queryData.data?.pages.flatMap((page) => page.tracks) ?? []

    // Start with an empty array
    const orderedTracks: LineupData[] = []

    // Add original track if included (should be first)
    if (includeOriginal && trackId) {
      const originalTrack = remixTracks.find((track) => track.id === trackId)
      if (originalTrack) {
        orderedTracks.push(originalTrack)
      }
    }

    // Add winner tracks if included (should be second)
    if (includeWinners && winnerIds?.length) {
      const winnerTracks = winnerIds.map((id) => ({
        id,
        type: EntityType.TRACK
      }))
      orderedTracks.push(...winnerTracks)
    }

    // Add remaining remix tracks (excluding original and winners)
    const remainingTracks = remixTracks.filter((track) => {
      if (includeOriginal && track.id === trackId) return false
      if (includeWinners && winnerIds?.includes(track.id)) return false
      return true
    })
    orderedTracks.push(...remainingTracks)

    return orderedTracks
  }, [
    queryData.data?.pages,
    includeOriginal,
    includeWinners,
    trackId,
    winnerIds
  ])

  const queryKey = getRemixesQueryKey({
    trackId,
    includeOriginal,
    includeWinners,
    pageSize,
    sortMethod,
    isCosign,
    isContestEntry
  })

  const lineupData = useLineupQuery({
    lineupData: processedLineupData,
    queryData,
    queryKey,
    lineupActions: remixesPageLineupActions,
    lineupSelector: remixesPageSelectors.getLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })

  return {
    ...lineupData,
    count: queryData.data?.pages[0]?.count
  }
}
