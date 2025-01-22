import { Id, full } from '@audius/sdk'
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
import { Config } from './types'
import { useLineupQuery } from './utils/useLineupQuery'

const filterMap: { [k in FeedFilter]: full.GetUserFeedFilterEnum } = {
  [FeedFilter.ALL]: 'all',
  [FeedFilter.ORIGINAL]: 'original',
  [FeedFilter.REPOST]: 'repost'
}

type FeedArgs = {
  userId: Nullable<ID>
  filter?: FeedFilter
  pageSize?: number
}

export const useFeed = (
  { userId, filter = FeedFilter.ALL, pageSize = 25 }: FeedArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const dispatch = useDispatch()

  return useLineupQuery<UserTrackMetadata | UserCollectionMetadata>({
    lineupActions: feedPageLineupActions,
    lineupSelector: feedPageSelectors.getDiscoverFeedLineup,
    playbackSource: PlaybackSource.TRACK_TILE_LINEUP, // TODO: shouldn't this be more specific?
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: (UserTrackMetadata | UserCollectionMetadata)[],
      allPages
    ) => {
      if (lastPage.length < pageSize) return undefined
      return allPages.length * pageSize
    },
    queryKey: [QUERY_KEYS.feed, userId, filter, pageSize],
    queryFn: async ({ pageParam }) => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getUserFeed({
        id: Id.parse(userId),
        userId: Id.parse(userId),
        filter: filterMap[filter],
        limit: pageSize,
        offset: 0,
        withUsers: true
      })

      const feed = transformAndCleanList(data, userFeedItemFromSDK).map(
        ({ item }) => item
      )
      if (feed === null) return []
      //   const filteredFeed = feed.filter((record) => !record.user.is_deactivated)
      //   const [tracks, collections] = getTracksAndCollections(filteredFeed)
      //   const flatTracksAndCollections = [...tracks, ...collections]

      // TODO: prime tan query caches
      dispatch(
        feedPageLineupActions.fetchLineupMetadatas(pageParam, pageSize, false, {
          feed
        })
      )

      return feed
    },
    ...config,
    enabled: userId !== null
  })
}

const getTracksAndCollections = (
  feed: Array<UserTrackMetadata | UserCollectionMetadata>
): [UserTrackMetadata[], UserCollectionMetadata[]] => {
  return feed.reduce<[UserTrackMetadata[], UserCollectionMetadata[]]>(
    (acc, cur) => {
      if ('track_id' in cur) {
        return [[...acc[0], cur], acc[1]]
      }
      return [acc[0], [...acc[1], cur]]
    },
    [[], []]
  )
}
