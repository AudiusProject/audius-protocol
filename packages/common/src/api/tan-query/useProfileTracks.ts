import { Id } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { combineStatuses, Status, Track } from '~/models'
import { PlaybackSource } from '~/models/Analytics'
import { ID, UID } from '~/models/Identifiers'
import { CommonState } from '~/store/commonStore'
import {
  profilePageSelectors,
  profilePageTracksLineupActions
} from '~/store/pages'
import { TracksSortMode } from '~/store/pages/profile/types'
import { getPlaying } from '~/store/player/selectors'

import { Config } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'

const DEFAULT_PAGE_SIZE = 15

type UseProfileTracksArgs = {
  handle: string
  pageSize?: number
  sort?: TracksSortMode
  getUnlisted?: boolean
}

export const useProfileTracks = (
  {
    handle,
    pageSize = DEFAULT_PAGE_SIZE,
    sort = TracksSortMode.RECENT,
    getUnlisted = true
  }: UseProfileTracksArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const playing = useSelector(getPlaying)
  const lineup = useSelector((state: CommonState) =>
    profilePageSelectors.getProfileTracksLineup(state, handle)
  )

  const result = useInfiniteQuery({
    queryKey: ['profileTracks', handle, pageSize, sort, getUnlisted],
    initialPageParam: 0,
    getNextPageParam: (lastPage: Track[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      if (!handle) return []

      const { data: tracks } = await sdk.full.users.getTracksByUserHandle({
        handle,
        userId: currentUserId ? Id.parse(currentUserId) : undefined,
        limit: pageSize,
        offset: pageParam,
        sort: sort === TracksSortMode.POPULAR ? 'plays' : 'date',
        filterTracks: getUnlisted ? 'all' : 'public'
      })

      if (!tracks) return []

      const processedTracks = transformAndCleanList(
        tracks,
        userTrackMetadataFromSDK
      )
      primeTrackData({ tracks: processedTracks, queryClient, dispatch })

      // Update lineup when new data arrives
      dispatch(
        profilePageTracksLineupActions.fetchLineupMetadatas(
          pageParam,
          pageSize,
          false,
          { tracks: processedTracks, handle }
        )
      )

      return processedTracks
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!handle
  })

  const status = combineStatuses([
    result.isPending || result.isFetchingNextPage
      ? Status.LOADING
      : Status.SUCCESS,
    lineup.status
  ])

  // Lineup actions
  const togglePlay = (uid: UID, id: ID) => {
    dispatch(
      profilePageTracksLineupActions.togglePlay(
        uid,
        id,
        PlaybackSource.TRACK_PAGE
      )
    )
  }

  const play = (uid?: UID) => {
    dispatch(profilePageTracksLineupActions.play(uid))
  }

  const pause = () => {
    dispatch(profilePageTracksLineupActions.pause())
  }

  const updateLineupOrder = (orderedIds: UID[]) => {
    dispatch(
      profilePageTracksLineupActions.updateLineupOrder(orderedIds, handle)
    )
  }

  return {
    ...result,
    status,
    lineup: {
      ...lineup,
      status,
      isMetadataLoading: status === Status.LOADING,
      hasMore: result.isLoading ? true : result.hasNextPage
    },
    pageSize,
    togglePlay,
    play,
    pause,
    updateLineupOrder,
    playing
  }
}
