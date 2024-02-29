import {
  SmartCollectionVariant,
  Track,
  UserTrackMetadata,
  UserTrack
} from '@audius/common/models'
import { responseAdapter } from '@audius/common/services'
import {
  accountSelectors,
  smartCollectionPageActions,
  collectionPageLineupActions,
  collectionPageActions,
  getContext
} from '@audius/common/store'
import { encodeHashId, removeNullable } from '@audius/common/utils'
import { takeEvery, put, call, select } from 'typed-redux-saga'

import { processAndCacheTracks } from 'common/store/cache/tracks/utils'
import { fetchUsers as retrieveUsers } from 'common/store/cache/users/sagas'
import { requiresAccount } from 'common/utils/requiresAccount'
import { waitForRead } from 'utils/sagaHelpers'

import { EXPLORE_PAGE } from '../../../utils/route'

import {
  HEAVY_ROTATION,
  BEST_NEW_RELEASES,
  MOST_LOVED,
  FEELING_LUCKY,
  UNDER_THE_RADAR,
  REMIXABLES
} from './smartCollections'
const { setSmartCollection } = collectionPageActions
const { fetchSmartCollection, fetchSmartCollectionSucceeded } =
  smartCollectionPageActions

const { getUserId } = accountSelectors

const COLLECTIONS_LIMIT = 25

function* fetchHeavyRotation() {
  yield* waitForRead()

  const currentUserId = yield* select(getUserId)
  const audiusSdk = yield* getContext('audiusSdk')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const sdk = yield* call(audiusSdk)

  const { data, signature } = yield* call([
    audiusBackendInstance,
    audiusBackendInstance.signDiscoveryNodeRequest
  ])
  if (!currentUserId) return { ...HEAVY_ROTATION }
  const activity = yield* call(
    [sdk.full.users, sdk.full.users.getUsersTrackHistory],
    {
      id: encodeHashId(currentUserId),
      encodedDataMessage: data,
      encodedDataSignature: signature,
      sortMethod: 'most_listens_by_user',
      limit: 20
    }
  )
  const activityData = activity.data
  if (!activityData) return { ...HEAVY_ROTATION }

  const mostListenedTracks = activityData
    .map(responseAdapter.makeActivity)
    .filter(removeNullable) as UserTrackMetadata[]

  const users = yield* call(
    retrieveUsers,
    mostListenedTracks.map((t) => t.owner_id)
  )

  const trackIds = mostListenedTracks
    .filter(
      (track) =>
        users.entries[track.owner_id] &&
        !users.entries[track.owner_id].is_deactivated &&
        !track.is_delete
    )
    .map((track) => ({
      track: track.track_id
    }))

  return {
    ...HEAVY_ROTATION,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

function* fetchBestNewReleases() {
  yield* waitForRead()
  const explore = yield* getContext('explore')
  const currentUserId = yield* select(getUserId)
  if (currentUserId == null) {
    return
  }
  const tracks = yield* call(
    [explore, 'getTopFolloweeTracksFromWindow'],
    currentUserId,
    'month'
  )

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
  yield* waitForRead()
  const explore = yield* getContext('explore')
  const currentUserId = yield* select(getUserId)
  if (currentUserId == null) {
    return
  }
  const tracks = yield* call([explore, 'getFeedNotListenedTo'], currentUserId)

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
  yield* waitForRead()
  const currentUserId = yield* select(getUserId)
  if (currentUserId == null) {
    return
  }

  const explore = yield* getContext('explore')
  const tracks = yield* call([explore, 'getMostLovedTracks'], currentUserId)
  const trackIds = tracks
    .filter((track) => !track.user.is_deactivated)
    .map((track: UserTrackMetadata) => ({
      time: track.created_at,
      track: track.track_id
    }))

  yield* call(processAndCacheTracks, tracks)

  return {
    ...MOST_LOVED,
    playlist_contents: {
      track_ids: trackIds
    }
  }
}

function* fetchFeelingLucky() {
  yield* waitForRead()
  const currentUserId = yield* select(getUserId)
  const explore = yield* getContext('explore')

  const tracks = yield* call([explore, 'getFeelingLuckyTracks'], currentUserId)
  const trackIds = tracks
    .filter((track) => !track.user.is_deactivated)
    .map((track: UserTrackMetadata) => ({
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
  yield* waitForRead()
  const explore = yield* getContext('explore')
  const currentUserId = yield* select(getUserId)
  if (currentUserId == null) {
    return
  }
  const tracks = yield* call(
    [explore, 'getRemixables'],
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
  yield* takeEvery(
    fetchSmartCollection.type,
    function* (action: ReturnType<typeof fetchSmartCollection>) {
      yield* waitForRead()

      const { variant } = action.payload

      const collection: any = yield* call(fetchMap[variant])

      if (collection) {
        yield* put(
          fetchSmartCollectionSucceeded({
            variant,
            collection
          })
        )
      }
      yield* put(setSmartCollection(variant))
      yield put(
        collectionPageLineupActions.fetchLineupMetadatas(
          0,
          200,
          false,
          undefined
        )
      )
    }
  )
}

export default function sagas() {
  return [watchFetch]
}
