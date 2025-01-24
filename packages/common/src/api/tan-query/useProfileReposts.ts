import { Id } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'

import { repostActivityFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import {
  combineStatuses,
  Status,
  Track,
  Collection,
  UserTrackMetadata,
  UserCollectionMetadata
} from '~/models'
import { PlaybackSource } from '~/models/Analytics'
import { ID, UID } from '~/models/Identifiers'
import { CommonState } from '~/store/commonStore'
import {
  profilePageSelectors,
  profilePageFeedLineupActions as feedActions
} from '~/store/pages'
import { getPlaying } from '~/store/player/selectors'

import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { primeCollectionData } from './utils/primeCollectionData'
import { primeTrackData } from './utils/primeTrackData'

const DEFAULT_PAGE_SIZE = 10

type UseProfileRepostsArgs = {
  handle: string
  pageSize?: number
}

export const useProfileReposts = (
  { handle, pageSize = DEFAULT_PAGE_SIZE }: UseProfileRepostsArgs,
  config?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const playing = useSelector(getPlaying)
  const lineup = useSelector((state: CommonState) =>
    profilePageSelectors.getProfileFeedLineup(state, handle)
  )

  const result = useInfiniteQuery({
    queryKey: ['profileReposts', handle, pageSize],
    initialPageParam: 0,
    getNextPageParam: (lastPage: (Track | Collection)[], allPages) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      if (!handle) return []

      const { data: repostsSDKData } = await sdk.full.users.getRepostsByHandle({
        handle,
        userId: currentUserId ? Id.parse(currentUserId) : undefined,
        limit: pageSize,
        offset: pageParam
      })

      if (!repostsSDKData) return []

      // Transform the reposts data and get just the items
      const reposts = transformAndCleanList(
        repostsSDKData,
        (activity) => repostActivityFromSDK(activity)?.item
      )

      primeTrackData({
        tracks: reposts.filter(
          (item): item is UserTrackMetadata => 'track_id' in item
        ),
        queryClient,
        dispatch
      })
      primeCollectionData({
        collections: reposts.filter(
          (item): item is UserCollectionMetadata => 'playlist_id' in item
        ),
        queryClient,
        dispatch
      })

      // Update lineup when new data arrives
      dispatch(
        feedActions.fetchLineupMetadatas(pageParam, pageSize, false, {
          reposts,
          handle
        })
      )

      return reposts
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
    dispatch(feedActions.togglePlay(uid, id, PlaybackSource.TRACK_PAGE))
  }

  const play = (uid?: UID) => {
    dispatch(feedActions.play(uid))
  }

  const pause = () => {
    dispatch(feedActions.pause())
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
    playing
  }
}
