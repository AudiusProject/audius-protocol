import { Id } from '@audius/sdk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userTrackMetadataFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { UserTrackMetadata } from '~/models'
import { PlaybackSource } from '~/models/Analytics'
import {
  profilePageSelectors,
  profilePageTracksLineupActions
} from '~/store/pages'
import { TracksSortMode } from '~/store/pages/profile/types'

import { useTypedQueryClient } from './typed-query-client'
import { QUERY_KEYS } from './typed-query-client/queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const DEFAULT_PAGE_SIZE = 10

type UseProfileTracksArgs = {
  handle: string
  pageSize?: number
  sort?: TracksSortMode
  getUnlisted?: boolean
}

export const getProfileTracksQueryKey = ({
  handle,
  pageSize,
  sort,
  getUnlisted
}: UseProfileTracksArgs) => [
  QUERY_KEYS.profileTracks,
  handle,
  { pageSize, sort, getUnlisted }
]

export const useProfileTracks = (
  {
    handle,
    pageSize = DEFAULT_PAGE_SIZE,
    sort = TracksSortMode.RECENT,
    getUnlisted = true
  }: UseProfileTracksArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    queryKey: getProfileTracksQueryKey({ handle, pageSize, sort, getUnlisted }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: UserTrackMetadata[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      if (!handle) return []
      // If the @ is still at the beginning of the handle, trim it off
      const handleNoAt = handle.startsWith('@') ? handle.substring(1) : handle
      const { data: tracks } = await sdk.full.users.getTracksByUserHandle({
        handle: handleNoAt,
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
          { items: processedTracks, handle }
        )
      )

      return processedTracks
    },
    select: (data) => data?.pages.flat(),
    ...options,
    enabled: options?.enabled !== false && !!handle
  })

  return useLineupQuery({
    queryData,
    queryKey: getProfileTracksQueryKey({
      handle,
      pageSize,
      sort,
      getUnlisted
    }),
    lineupActions: profilePageTracksLineupActions,
    lineupSelector: profilePageSelectors.getProfileTracksLineup,
    playbackSource: PlaybackSource.TRACK_TILE,
    pageSize
  })
}
