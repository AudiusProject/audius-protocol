import { Kind } from '@audius/common/models'
import {
  profilePageFeedLineupActions as feedActions,
  profilePageSelectors,
  collectionsSocialActions,
  tracksSocialActions,
  accountSelectors
} from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { select, takeEvery, put } from 'redux-saga/effects'

import { LineupSagas } from 'common/store/lineup/sagas'

const { getProfileUserId, getProfileFeedLineup } = profilePageSelectors
const { getUserHandle } = accountSelectors

const sourceSelector = (state, handle) =>
  `${feedActions.prefix}:${getProfileUserId(state, handle)}`

class FeedSagas extends LineupSagas {
  constructor() {
    super(
      feedActions.prefix,
      feedActions,
      getProfileFeedLineup,
      function* (action) {
        return action.payload.reposts
      },
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
