import { Name, Track, User } from '@audius/common'
import { takeEvery, put, call, select } from 'redux-saga/effects'

import { getTrack } from 'common/store/cache/tracks/selectors'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { getUser } from 'common/store/cache/users/selectors'
import {
  startStemUploads,
  stemUploadsSucceeded
} from 'common/store/stems-upload/slice'
import { handleUploads } from 'pages/upload-page/store/sagas'
import { createStemMetadata } from 'pages/upload-page/store/utils/stems'
import { make } from 'store/analytics/actions'

function* watchUploadStems() {
  yield takeEvery(
    startStemUploads.type,
    function* (action: ReturnType<typeof startStemUploads>) {
      const { uploads, parentId, batchUID } = action.payload
      const stemTracks = uploads.map((u) => {
        const metadata = createStemMetadata({
          parentTrackId: parentId,
          track: u.metadata,
          stemCategory: u.category
        })
        return {
          metadata,
          track: {
            ...u,
            metadata
          }
        }
      })
      const { trackIds } = yield call(handleUploads, {
        tracks: stemTracks,
        isCollection: false,
        isStem: true
      })

      yield put(stemUploadsSucceeded({ parentId, batchUID }))

      if (trackIds) {
        for (let i = 0; i < trackIds.length; i += 1) {
          const trackId = trackIds[i]
          const category = stemTracks[i].metadata.stem_of.category
          const recordEvent = make(Name.STEM_COMPLETE_UPLOAD, {
            id: trackId,
            parent_track_id: parentId,
            category
          })
          yield put(recordEvent)
        }
      }

      // Retrieve the parent track to refresh stems
      const track: Track = yield select(getTrack, { id: parentId })
      const ownerUser: User = yield select(getUser, { id: track.owner_id })
      yield call(retrieveTracks, {
        trackIds: [
          { id: parentId, handle: ownerUser.handle, url_title: track.title }
        ],
        withStems: true,
        canBeUnlisted: true
      })
    }
  )
}

const sagas = () => {
  return [watchUploadStems]
}

export default sagas
