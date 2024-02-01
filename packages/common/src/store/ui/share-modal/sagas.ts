import { takeEvery, put, select } from 'typed-redux-saga'

import { getCollection as getCollectionBase } from '~/store/cache/collections/selectors'
import { getTrack as getTrackBase } from '~/store/cache/tracks/selectors'
import { getUser as getUserBase } from '~/store/cache/users/selectors'
import { CommonState } from '~/store/commonStore'

import { ID } from '../../../models'
import { setVisibility } from '../modals/parentSlice'

import { open, requestOpen } from './slice'
import { ShareModalRequestOpenAction } from './types'

const getTrack = (id: ID) => (state: CommonState) => getTrackBase(state, { id })
const getUser = (id: ID) => (state: CommonState) => getUserBase(state, { id })
const getCollection = (id: ID) => (state: CommonState) =>
  getCollectionBase(state, { id })

function* handleRequestOpen(action: ShareModalRequestOpenAction) {
  switch (action.payload.type) {
    case 'track': {
      const { trackId, source, type } = action.payload
      const track = yield* select(getTrack(trackId))
      if (!track) return
      const artist = yield* select(getUser(track.owner_id))
      if (!artist) return
      yield put(open({ type, track, source, artist }))
      break
    }
    case 'profile': {
      const { profileId, source, type } = action.payload
      const profile = yield* select(getUser(profileId))
      if (!profile) return
      yield put(open({ type, profile, source }))
      break
    }
    case 'collection': {
      const { collectionId, source } = action.payload
      const collection = yield* select(getCollection(collectionId))
      if (!collection) return
      const owner = yield* select(getUser(collection.playlist_owner_id))
      if (!owner) return
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
    case 'audioNftPlaylist': {
      const { userId, source } = action.payload
      const user = yield* select(getUser(userId))
      if (!user) return
      yield put(
        open({
          type: 'audioNftPlaylist',
          user,
          source
        })
      )
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
