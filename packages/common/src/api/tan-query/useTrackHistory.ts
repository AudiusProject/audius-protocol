import { useEffect } from 'react'

import { Id, full } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { trackActivityFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { UserTrackMetadata } from '~/models'
import { PlaybackSource } from '~/models/Analytics'
import { ID, UID } from '~/models/Identifiers'
import { historyPageTracksLineupActions } from '~/store/pages'
import { getPlaying } from '~/store/player/selectors'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'

const DEFAULT_PAGE_SIZE = 30

type UseTrackHistoryArgs = {
  pageSize?: number
  query?: string
  sortMethod?: full.GetUsersTrackHistorySortMethodEnum
  sortDirection?: full.GetUsersTrackHistorySortDirectionEnum
}

export const useTrackHistory = (
  {
    pageSize = DEFAULT_PAGE_SIZE,
    query,
    sortMethod,
    sortDirection
  }: UseTrackHistoryArgs = {},
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const playing = useSelector(getPlaying)

  const result = useInfiniteQuery({
    queryKey: [
      QUERY_KEYS.trackHistory,
      pageSize,
      query,
      sortMethod,
      sortDirection
    ],
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserTrackMetadata[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      if (!currentUserId) return []

      const { data: activityData } = await sdk.full.users.getUsersTrackHistory({
        id: Id.parse(currentUserId),
        limit: pageSize,
        offset: pageParam,
        query,
        sortMethod,
        sortDirection
      })

      if (!activityData) return []

      const tracks = transformAndCleanList(
        activityData,
        (activity: full.ActivityFull) => trackActivityFromSDK(activity)?.item
      )
      primeTrackData({ tracks, queryClient, dispatch })
      return tracks
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUserId
  })

  // Lineup actions
  const togglePlay = (uid: UID, id: ID) => {
    dispatch(
      historyPageTracksLineupActions.togglePlay(
        uid,
        id,
        PlaybackSource.HISTORY_PAGE
      )
    )
  }

  const play = (uid?: UID) => {
    dispatch(historyPageTracksLineupActions.play(uid))
  }

  const pause = () => {
    dispatch(historyPageTracksLineupActions.pause())
  }

  const updateLineupOrder = (orderedIds: UID[]) => {
    dispatch(historyPageTracksLineupActions.updateLineupOrder(orderedIds))
  }

  // Update lineup when new data arrives
  const latestTracks = result.data?.pages[result.data.pages.length - 1] ?? []
  const offset = (result.data?.pages.length ?? 0) * pageSize
  const limit = result.data?.pages[0]?.length ?? pageSize

  useEffect(() => {
    if (latestTracks.length > 0) {
      dispatch(
        historyPageTracksLineupActions.fetchLineupMetadatas(
          offset - limit,
          limit,
          false,
          { tracks: latestTracks }
        )
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, offset, limit])

  return {
    ...result,
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    playing
  }
}
