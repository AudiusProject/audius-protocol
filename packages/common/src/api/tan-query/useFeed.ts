import { Id, full } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { transformAndCleanList, userFeedItemFromSDK } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import {
  FeedFilter,
  UserCollectionMetadata,
  ID,
  UserTrackMetadata
} from '~/models'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

const filterMap: { [k in FeedFilter]: full.GetUserFeedFilterEnum } = {
  [FeedFilter.ALL]: 'all',
  [FeedFilter.ORIGINAL]: 'original',
  [FeedFilter.REPOST]: 'repost'
}

type FeedArgs = {
  userId: ID
  filter?: FeedFilter
  limit?: number
  offset?: number
  followeeUserIds?: ID[]
}

export const useFeed = (
  {
    userId,
    filter = FeedFilter.ALL,
    limit = 25,
    offset = 0,
    followeeUserIds
  }: FeedArgs,
  config?: Config
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: [QUERY_KEYS.feed, userId, filter, limit, offset, followeeUserIds],
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data = [] } = await sdk.full.users.getUserFeed({
        id: Id.parse(userId),
        userId: Id.parse(userId),
        filter: filterMap[filter],
        limit,
        offset,
        followeeUserId: followeeUserIds?.length ? followeeUserIds : undefined,
        withUsers: true
      })

      const feed = transformAndCleanList(data, userFeedItemFromSDK).map(
        ({ item }) => item
      )
      if (feed === null) return []
      const filteredFeed = feed.filter((record) => !record.user.is_deactivated)
      const [tracks, collections] = getTracksAndCollections(filteredFeed)

      // TODO: prime caches

      return [...tracks, ...collections]
    },
    ...config
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
