import { takeEvery, put, select } from 'redux-saga/effects'

import { Collection } from 'common/models/Collection'
import { ID } from 'common/models/Identifiers'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'
import { CommonState } from 'common/store'
import { getCollection as getCollectionBase } from 'common/store/cache/collections/selectors'
import { getTrack as getTrackBase } from 'common/store/cache/tracks/selectors'
import { getUser as getUserBase } from 'common/store/cache/users/selectors'

import { setVisibility } from '../modals/slice'

import { open, requestOpen } from './slice'
import { RequestOpenAction } from './types'

const getTrack = (id: ID) => (state: CommonState) => getTrackBase(state, { id })
const getUser = (id: ID) => (state: CommonState) => getUserBase(state, { id })
const getCollection = (id: ID) => (state: CommonState) =>
  getCollectionBase(state, { id })

function* handleRequestOpen(action: RequestOpenAction) {
  switch (action.payload.type) {
    case 'track': {
      const { trackId, source, type } = action.payload
      const track: Track = yield select(getTrack(trackId))
      const artist: User = yield select(getUser(track.owner_id))
      yield put(open({ type, track, source, artist }))
      break
    }
    case 'profile': {
      const { profileId, source, type } = action.payload
      const profile: User = yield select(getUser(profileId))
      yield put(open({ type, profile, source }))
      break
    }
    case 'collection': {
      const { collectionId, source } = action.payload
      const collection: Collection = yield select(getCollection(collectionId))
      const owner: User = yield select(getUser(collection.playlist_owner_id))
      if (collection.is_album) {
        yield put(
          open({ type: 'album', album: collection, artist: owner, source })
        )
      } else {
        yield put(
          open({
            type: 'playlist',
            playlist: collection,
            creator: owner,
            source
          })
        )
      }
      break
    }
  }

  yield put(setVisibility({ modal: 'Share', visible: true }))
}

function* watchHandleRequestOpen() {
  yield takeEvery(requestOpen, handleRequestOpen)
}

export default function sagas() {
  return [watchHandleRequestOpen]
}
