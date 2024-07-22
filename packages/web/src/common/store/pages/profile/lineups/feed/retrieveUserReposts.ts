import { repostActivityFromSDK } from '@audius/common/adapters'
import {
  UserCollection,
  ID,
  Track,
  UserTrackMetadata,
  OptionalId
} from '@audius/common/models'
import { transformAndCleanList } from '@audius/common/src/adapters/utils'
import { getContext, getSDK } from '@audius/common/store'
import { compareSDKResponse } from '@audius/common/utils'
import { full } from '@audius/sdk'
import { all } from 'redux-saga/effects'

import { processAndCacheCollections } from 'common/store/cache/collections/utils'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { waitForRead } from 'utils/sagaHelpers'

const getTracksAndCollections = (
  feed: (UserTrackMetadata | UserCollection)[]
) =>
  feed.reduce(
    (
      acc: [UserTrackMetadata[], UserCollection[]],
      cur: UserTrackMetadata | UserCollection
    ) =>
      ('track_id' in cur
        ? [[...acc[0], cur], acc[1]]
        : [acc[0], [...acc[1], cur]]) as [
        UserTrackMetadata[],
        UserCollection[]
      ],
    [[], []]
  )

type RetrieveUserRepostsArgs = {
  handle: string
  currentUserId: ID | null
  offset?: number
  limit?: number
}

export function* retrieveUserReposts({
  handle,
  currentUserId,
  offset,
  limit
}: RetrieveUserRepostsArgs): Generator<any, Track[], any> {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')
  const sdk = yield* getSDK()
  const reposts = yield apiClient.getUserRepostsByHandle({
    handle,
    currentUserId,
    limit,
    offset
  })

  const { data: repostsSDKData } = yield sdk.full.users.getRepostsByHandle({
    handle,
    userId: OptionalId.parse(currentUserId),
    limit,
    offset
  })
  const repostsSDK = transformAndCleanList(
    repostsSDKData,
    // `getTracksAndCollections` below expects a list of just the items
    (activity: full.ActivityFull) => repostActivityFromSDK(activity)?.item
  )
  compareSDKResponse(
    { legacy: reposts, migrated: repostsSDK },
    'getRepostsByHandle'
  )
  const [tracks, collections] = getTracksAndCollections(reposts)
  const trackIds = tracks.map((t) => t.track_id)
  const [processedTracks, processedCollections] = yield all([
    processAndCacheTracks(tracks),
    processAndCacheCollections(
      collections,
      /* shouldRetrieveTracks */ false,
      trackIds
    )
  ])
  const processedTracksMap = processedTracks.reduce(
    (acc: any, cur: any) => ({ ...acc, [cur.track_id]: cur }),
    {}
  )
  const processedCollectionsMap = processedCollections.reduce(
    (acc: any, cur: any) => ({ ...acc, [cur.playlist_id]: cur }),
    {}
  )
  const processed = reposts.map((m: any) =>
    m.track_id
      ? processedTracksMap[m.track_id]
      : processedCollectionsMap[m.playlist_id]
  )

  return processed
}
