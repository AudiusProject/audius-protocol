import { call, select, all } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'
import {
  PREFIX,
  feedActions
} from 'containers/feed-page/store/lineups/feed/actions'
import { LineupSagas } from 'store/lineup/sagas'
import { getFeedFilter } from 'containers/feed-page/store/selectors'
import { waitForValue } from 'utils/sagaHelpers'
import {
  getAccountReady,
  getStartedSignOnProcess
} from 'containers/sign-on/store/selectors'
import { Kind } from 'store/types'
import { processAndCacheTracks } from 'store/cache/tracks/utils'
import { processAndCacheCollections } from 'store/cache/collections/utils'

function* getTracks({ offset, limit }) {
  // In the case of sign on, we get an account before we have followed anyone,
  // so we should also wait for account ready.
  const startedSignOn = yield select(getStartedSignOnProcess)
  if (startedSignOn) {
    yield call(waitForValue, getAccountReady)
  }

  const filter = yield select(getFeedFilter)
  // NOTE: The `/feed` does not paginate, so the feed is requested from 0 to N
  const feed = yield call(AudiusBackend.getSocialFeed, {
    offset: 0,
    limit: offset + limit,
    filter: filter
  })
  if (!feed.length) return []
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

const keepActivityTimeStamp = entry => ({
  uid: entry.uid,
  kind: entry.track_id ? Kind.TRACKS : Kind.COLLECTIONS,
  id: entry.track_id || entry.playlist_id,
  activityTimestamp: entry.activity_timestamp
})

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      PREFIX,
      feedActions,
      store => store.feed.feed,
      getTracks,
      keepActivityTimeStamp
    )
  }
}

export default function sagas() {
  return new FeedSagas().getSagas()
}
