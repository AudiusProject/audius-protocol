import { getContext } from '@audius/common'
import {
  UserCollection,
  ID,
  Track,
  UserTrackMetadata
} from '@audius/common/models'
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
  const reposts = yield apiClient.getUserRepostsByHandle({
    handle,
    currentUserId,
    limit,
    offset
  })
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
