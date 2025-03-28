import { Id, full } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { transformAndCleanList, userFeedItemFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import {
  FeedFilter,
  UserCollectionMetadata,
  ID,
  UserTrackMetadata,
  PlaybackSource
} from '~/models'
import { feedPageSelectors, feedPageLineupActions } from '~/store/pages'
import { Nullable } from '~/utils/typeUtils'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { primeCollectionData } from './utils/primeCollectionData'
import { primeTrackData } from './utils/primeTrackData'
import { useLineupQuery } from './utils/useLineupQuery'

const filterMap: { [k in FeedFilter]: full.GetUserFeedFilterEnum } = {
  [FeedFilter.ALL]: 'all',
  [FeedFilter.ORIGINAL]: 'original',
  [FeedFilter.REPOST]: 'repost'
}

type FeedArgs = {
  userId: Nullable<ID>
  filter?: FeedFilter
  initialPageSize?: number
  loadMorePageSize?: number
}

export const getFeedQueryKey = ({ userId, filter }: FeedArgs) => [
  QUERY_KEYS.feed,
  userId,
  { filter }
]

export const FEED_INITIAL_PAGE_SIZE = 10
export const FEED_LOAD_MORE_PAGE_SIZE = 4

export const useFeed = (
  {
    userId,
    filter = FeedFilter.ALL,
    initialPageSize = FEED_INITIAL_PAGE_SIZE,
    loadMorePageSize = FEED_LOAD_MORE_PAGE_SIZE
  }: FeedArgs,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryData = useInfiniteQuery({
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: (UserTrackMetadata | UserCollectionMetadata)[],
      allPages
    ) => {
      const isFirstPage = allPages.length === 1
      const currentPageSize = isFirstPage ? initialPageSize : loadMorePageSize
      if (lastPage.length < currentPageSize) return undefined
      return allPages.reduce((total, page) => total + page.length, 0)
    },
    queryKey: getFeedQueryKey({ userId, filter }),
    queryFn: async ({ pageParam }) => {
      const isFirstPage = pageParam === 0
      const currentPageSize = isFirstPage ? initialPageSize : loadMorePageSize
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getUserFeed({
        id: Id.parse(userId),
        userId: Id.parse(userId),
        filter: filterMap[filter],
        limit: currentPageSize,
        offset: pageParam,
        withUsers: true
      })

      const feed = transformAndCleanList(data, userFeedItemFromSDK).map(
        ({ item }) => item
      )
      if (feed === null) return []

      const { tracks, collections } = feed.reduce(
        (acc, item) => {
          if ('track_id' in item) {
            acc.tracks.push(item)
          } else {
            acc.collections.push(item)
          }
          return acc
        },
        {
          tracks: [] as UserTrackMetadata[],
          collections: [] as UserCollectionMetadata[]
        }
      )

      // Prime caches
      primeTrackData({ tracks, queryClient, dispatch })
      primeCollectionData({ collections, queryClient, dispatch })

      // Pass the data to lineup sagas
      dispatch(
        feedPageLineupActions.fetchLineupMetadatas(
          pageParam,
          currentPageSize,
          false,
          { feed }
        )
      )

      return feed
    },
    select: (data) => data?.pages.flat(),
    ...options,
    enabled: userId !== null
  })

  return useLineupQuery({
    queryData,
    queryKey: getFeedQueryKey({
      userId,
      filter
    }),
    lineupActions: feedPageLineupActions,
    lineupSelector: feedPageSelectors.getDiscoverFeedLineup,
    playbackSource: PlaybackSource.TRACK_TILE_LINEUP,
    pageSize: loadMorePageSize
  })
}
