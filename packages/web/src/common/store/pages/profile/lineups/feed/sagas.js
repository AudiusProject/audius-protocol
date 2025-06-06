import { queryAccountUser, queryCurrentUserId } from '@audius/common/api'
import { Kind } from '@audius/common/models'
import {
  profilePageFeedLineupActions as feedActions,
  profilePageSelectors,
  collectionsSocialActions,
  tracksSocialActions
} from '@audius/common/store'
import { makeUid } from '@audius/common/utils'
import { select, call, takeEvery, put } from 'redux-saga/effects'

import { LineupSagas } from 'common/store/lineup/sagas'
import { waitForRead } from 'utils/sagaHelpers'

import { retrieveUserReposts } from './retrieveUserReposts'
const { getProfileUserId, getProfileFeedLineup } = profilePageSelectors

function* getReposts({ offset, limit, handle }) {
  yield waitForRead()

  const currentUserId = yield call(queryCurrentUserId)
  const reposts = yield call(retrieveUserReposts, {
    handle,
    currentUserId,
    offset,
    limit
  })
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
  const accountUser = yield call(queryAccountUser)
  const accountHandle = accountUser?.handle

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
  const accountUser = yield call(queryAccountUser)
  const accountHandle = accountUser?.handle
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
  const accountUser = yield call(queryAccountUser)
  const accountHandle = accountUser?.handle

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
  const accountUser = yield call(queryAccountUser)
  const accountHandle = accountUser?.handle
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
