import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheTracksSelectors,
  profilePageFeedLineupActions as feedActions,
  profilePageSelectors,
  collectionsSocialActions,
  tracksSocialActions,
  confirmerSelectors
} from '@audius/common/store'

import { Kind } from '@audius/common/models'
import {
  makeUid,
  getIdFromKindId,
  getKindFromKindId
} from '@audius/common/utils'
import { select, call, takeEvery, put } from 'redux-saga/effects'

import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { retrieveUserReposts } from './retrieveUserReposts'
const { getProfileUserId, getProfileFeedLineup } = profilePageSelectors
const { getTracks } = cacheTracksSelectors
const { getCollections } = cacheCollectionsSelectors
const { getUserId, getUserHandle } = accountSelectors
const { getConfirmCalls } = confirmerSelectors

function* getReposts({ offset, limit, handle }) {
  yield waitForRead()

  const profileId = yield select((state) => getProfileUserId(state, handle))

  const currentUserId = yield select(getUserId)
  let reposts = yield call(retrieveUserReposts, {
    handle,
    currentUserId,
    offset,
    limit
  })

  // If we're on our own profile, add any
  // tracks or collections that haven't confirmed yet.
  // Only do this on page 1 of the reposts tab
  if (profileId === currentUserId && offset === 0) {
    // Get everything that is confirming
    const confirming = yield select(getConfirmCalls)
    if (Object.keys(confirming).length > 0) {
      const repostTrackIds = new Set(
        reposts.map((r) => r.track_id).filter(Boolean)
      )
      const repostCollectionIds = new Set(
        reposts.map((r) => r.playlist_id).filter(Boolean)
      )

      const tracks = yield select(getTracks)
      const collections = yield select(getCollections)

      // For each confirming entry, check if it's a track or collection,
      // then check if we have reposted/favorited it, and check to make
      // sure we're not already getting back that same track or collection from the
      // backend.
      // If we aren't, this is an unconfirmed repost, prepend it to the lineup.
      Object.keys(confirming).forEach((kindId) => {
        const kind = getKindFromKindId(kindId)
        const id = getIdFromKindId(kindId)
        if (kind === Kind.TRACKS) {
          const track = tracks[id]
          if (
            track.has_current_user_reposted &&
            !repostTrackIds.has(track.track_id)
          ) {
            reposts = [track, ...reposts]
          }
        } else if (kind === Kind.COLLECTIONS) {
          const collection = collections[id]
          if (
            collection.has_current_user_reposted &&
            !repostCollectionIds.has(collection.playlist_id)
          ) {
            reposts = [collection, ...reposts]
          }
        }
      })
    }
  }

  return reposts
}

const sourceSelector = (state, handle) =>
  `${feedActions.prefix}:${getProfileUserId(state, handle)}`

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      feedActions.prefix,
      feedActions,
      getProfileFeedLineup,
      getReposts,
      undefined,
      undefined,
      sourceSelector
    )
  }
}

function* addTrackRepost(action) {
  const { trackId, source } = action
  const accountHandle = yield select(getUserHandle)

  const formattedTrack = {
    kind: Kind.TRACKS,
    id: trackId,
    uid: makeUid(Kind.TRACKS, trackId, source)
  }

  yield put(feedActions.add(formattedTrack, trackId, accountHandle, true))
}

function* watchRepostTrack() {
  yield takeEvery(tracksSocialActions.REPOST_TRACK, addTrackRepost)
}

function* removeTrackRepost(action) {
  const { trackId } = action
  const accountHandle = yield select(getUserHandle)
  const lineup = yield select((state) =>
    getProfileFeedLineup(state, accountHandle)
  )
  const trackLineupEntry = lineup.entries.find((entry) => entry.id === trackId)
  if (trackLineupEntry) {
    yield put(
      feedActions.remove(Kind.TRACKS, trackLineupEntry.uid, accountHandle)
    )
  }
}

function* watchUndoRepostTrack() {
  yield takeEvery(tracksSocialActions.UNDO_REPOST_TRACK, removeTrackRepost)
}

function* addCollectionRepost(action) {
  const { collectionId, source } = action
  const accountHandle = yield select(getUserHandle)

  const formattedCollection = {
    kind: Kind.COLLECTIONS,
    id: collectionId,
    uid: makeUid(Kind.COLLECTIONS, collectionId, source)
  }

  yield put(
    feedActions.add(formattedCollection, collectionId, accountHandle, true)
  )
}

function* watchRepostCollection() {
  yield takeEvery(
    collectionsSocialActions.REPOST_COLLECTION,
    addCollectionRepost
  )
}

function* removeCollectionRepost(action) {
  const { collectionId } = action
  const accountHandle = yield select(getUserHandle)
  const lineup = yield select((state) =>
    getProfileFeedLineup(state, accountHandle)
  )
  const collectionLineupEntry = lineup.entries.find(
    (entry) => entry.id === collectionId
  )
  if (collectionLineupEntry) {
    yield put(
      feedActions.remove(
        Kind.COLLECTIONS,
        collectionLineupEntry.uid,
        accountHandle
      )
    )
  }
}

function* watchUndoRepostCollection() {
  yield takeEvery(
    collectionsSocialActions.UNDO_REPOST_COLLECTION,
    removeCollectionRepost
  )
}

export default function sagas() {
  const feedSagas = new FeedSagas().getSagas()
  return [
    ...feedSagas,
    watchRepostTrack,
    watchUndoRepostTrack,
    watchRepostCollection,
    watchUndoRepostCollection
  ]
}
