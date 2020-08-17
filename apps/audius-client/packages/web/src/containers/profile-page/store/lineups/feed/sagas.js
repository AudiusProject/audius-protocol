import { all, call } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'
import {
  PREFIX,
  feedActions
} from 'containers/profile-page/store/lineups/feed/actions'
import {
  getProfileUserId,
  getProfileFeedLineup
} from 'containers/profile-page/store/selectors'
import { LineupSagas } from 'store/lineup/sagas'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { processAndCacheCollections } from 'store/cache/collections/utils'

function* getTracks({ offset, limit, payload }) {
  const feed = yield call(AudiusBackend.getUserFeed, {
    offset,
    limit,
    userId: payload.userId
  })
  const [tracks, collections] = getTracksAndCollections(feed)
  const trackIds = tracks.map(t => t.track_id)

  // Process (e.g. cache and remove entries)
  const [processedTracks, processedCollections] = yield all([
    processAndCacheTracks(tracks),
    processAndCacheCollections(collections, true, trackIds)
  ])

  const processedTracksMap = processedTracks.reduce(
    (acc, cur) => ({ ...acc, [cur.track_id]: cur }),
    {}
  )
  const processedCollectionsMap = processedCollections.reduce(
    (acc, cur) => ({ ...acc, [cur.playlist_id]: cur }),
    {}
  )
  const processedFeed = feed.map(m =>
    m.track_id
      ? processedTracksMap[m.track_id]
      : processedCollectionsMap[m.playlist_id]
  )
  return processedFeed
}

const getTracksAndCollections = feed =>
  feed.reduce(
    (acc, cur) =>
      cur.track_id ? [[...acc[0], cur], acc[1]] : [acc[0], [...acc[1], cur]],
    [[], []]
  )

const sourceSelector = state => `${PREFIX}:${getProfileUserId(state)}`

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      feedActions,
      getProfileFeedLineup,
      getTracks,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}
