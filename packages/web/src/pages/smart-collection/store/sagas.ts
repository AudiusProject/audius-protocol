import { takeEvery, put, call, select } from 'typed-redux-saga/macro'

import { SmartCollection } from 'common/models/Collection'
import { SmartCollectionVariant } from 'common/models/SmartCollectionVariant'
import Status from 'common/models/Status'
import { Track, UserTrack } from 'common/models/Track'
import { getAccountStatus, getUserId } from 'common/store/account/selectors'
import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers as retrieveUsers } from 'common/store/cache/users/sagas'
import { setSmartCollection } from 'common/store/pages/collection/actions'
import {
  fetchSmartCollection,
  fetchSmartCollectionSucceeded
} from 'common/store/pages/smart-collection/slice'
import Explore from 'services/audius-backend/Explore'
import { waitForBackendSetup } from 'store/backend/sagas'
import { getLuckyTracks } from 'store/recommendation/sagas'
import { EXPLORE_PAGE } from 'utils/route'
import { requiresAccount, waitForValue } from 'utils/sagaHelpers'

import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  MOST_LOVED,
  FEELING_LUCKY,
  UNDER_THE_RADAR,
  REMIXABLES
} from '../smartCollections'

const COLLECTIONS_LIMIT = 25

function* fetchHeavyRotation() {
  const topListens = yield* call(Explore.getTopUserListens)

  const users = yield* call(
    retrieveUsers,
    topListens.map((t) => t.userId)
  )
  const trackIds = topListens
    .filter(
      (track) =>
        users.entries[track.userId] &&
        !users.entries[track.userId].is_deactivated
    )
    .map((listen) => ({
      track: listen.trackId
    }))

  return {
    ...HEAVY_ROTATION,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

function* fetchBestNewReleases() {
  const tracks = yield* call(Explore.getTopFolloweeTracksFromWindow, 'month')

  const trackIds = tracks
    .filter((track) => !track.user.is_deactivated)
    .map((track: Track) => ({
      time: track.created_at,
      track: track.track_id
    }))

  yield* call(processAndCacheTracks, tracks)

  return {
    ...BEST_NEW_RELEASES,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

function* fetchUnderTheRadar() {
  const tracks = yield* call(Explore.getFeedNotListenedTo)

  const trackIds = tracks
    .filter((track: UserTrack) => !track.user.is_deactivated)
    .map((track: Track) => ({
      time: track.activity_timestamp,
      track: track.track_id
    }))

  yield* call(processAndCacheTracks, tracks)

  // feed minus listened
  return {
    ...UNDER_THE_RADAR,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

function* fetchMostLoved() {
  const tracks = yield* call(Explore.getTopFolloweeSaves)

  const trackIds = tracks
    .filter((track) => !track.user.is_deactivated)
    .map((track: Track) => ({
      time: track.created_at,
      track: track.track_id
    }))

  yield call(processAndCacheTracks, tracks)

  return {
    ...MOST_LOVED,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

function* fetchFeelingLucky() {
  const tracks = yield* call(getLuckyTracks, COLLECTIONS_LIMIT)

  const trackIds = tracks
    .filter((track) => !track.user.is_deactivated)
    .map((track: Track) => ({
      time: track.created_at,
      track: track.track_id
    }))

  return {
    ...FEELING_LUCKY,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

function* fetchRemixables() {
  const currentUserId = yield* select(getUserId)
  if (currentUserId == null) {
    return
  }
  const tracks = yield* call(
    Explore.getRemixables,
    currentUserId,
    75 // limit
  )

  // Limit the number of times an artist can appear
  const artistLimit = 3
  const artistCount: Record<number, number> = {}

  const filteredTracks = tracks.filter((trackMetadata) => {
    if (trackMetadata.user?.is_deactivated) {
      return false
    }
    const id = trackMetadata.owner_id
    if (!artistCount[id]) {
      artistCount[id] = 0
    }
    artistCount[id]++
    return artistCount[id] <= artistLimit
  })

  const processedTracks = yield* call(
    processAndCacheTracks,
    filteredTracks.slice(0, COLLECTIONS_LIMIT)
  )

  const trackIds = processedTracks.map((track: Track) => ({
    time: track.created_at,
    track: track.track_id
  }))

  return {
    ...REMIXABLES,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

const fetchMap = {
  [SmartCollectionVariant.HEAVY_ROTATION]: requiresAccount(
    fetchHeavyRotation,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.BEST_NEW_RELEASES]: requiresAccount(
    fetchBestNewReleases,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.UNDER_THE_RADAR]: requiresAccount(
    fetchUnderTheRadar,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.MOST_LOVED]: requiresAccount(
    fetchMostLoved,
    EXPLORE_PAGE
  ),
  [SmartCollectionVariant.FEELING_LUCKY]: fetchFeelingLucky,
  [SmartCollectionVariant.REMIXABLES]: fetchRemixables,
  [SmartCollectionVariant.AUDIO_NFT_PLAYLIST]: () => {}
}

function* watchFetch() {
  yield takeEvery(
    fetchSmartCollection.type,
    function* (action: ReturnType<typeof fetchSmartCollection>) {
      yield call(waitForBackendSetup)
      yield call(
        waitForValue,
        getAccountStatus,
        {},
        (status) => status !== Status.LOADING
      )

      const { variant } = action.payload

      const collection: SmartCollection | undefined = yield* call(
        fetchMap[variant]
      )

      if (collection) {
        yield put(
          fetchSmartCollectionSucceeded({
            variant,
            collection
          })
        )
      }
      yield put(setSmartCollection(variant))
    }
  )
}

export default function sagas() {
  return [watchFetch]
}
