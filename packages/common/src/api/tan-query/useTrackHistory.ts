import { Id, full } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { trackActivityFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { UserTrackMetadata, Status } from '~/models'
import { PlaybackSource } from '~/models/Analytics'
import { ID, UID } from '~/models/Identifiers'
import { combineStatuses } from '~/models/Status'
import {
  historyPageTracksLineupActions,
  historyPageSelectors
} from '~/store/pages'
import { getPlaying } from '~/store/player/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
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
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const playing = useSelector(getPlaying)
  const lineup = useSelector(historyPageSelectors.getHistoryTracksLineup)

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

      // Update lineup when new data arrives
      dispatch(
        historyPageTracksLineupActions.fetchLineupMetadatas(
          pageParam,
          pageSize,
          false,
          { tracks }
        )
      )

      return tracks
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUserId
  })

  // Combine query status with lineup status
  const status = combineStatuses([
    result.status === 'pending' ? Status.LOADING : Status.SUCCESS,
    lineup.status
  ])

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

  return {
    ...result,
    status,
    entries: lineup.entries,
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    playing
  }
}
