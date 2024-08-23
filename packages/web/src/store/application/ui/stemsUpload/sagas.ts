import { Name, StemCategory } from '@audius/common/models'
import { stemsUploadActions } from '@audius/common/store'
import { takeEvery, put, call } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { retrieveTracks } from 'common/store/cache/tracks/utils'
import { handleUploads } from 'common/store/upload/sagas'
import { createStemMetadata } from 'pages/upload-page/store/utils/stems'

const { startStemUploads, stemUploadsSucceeded } = stemsUploadActions

function* watchUploadStems() {
  yield* takeEvery(
    startStemUploads.type,
    function* (action: ReturnType<typeof startStemUploads>) {
      const { uploads, parentId, batchUID } = action.payload
      const stemTracks = uploads.map((u) => {
        const metadata = createStemMetadata({
          parentTrackId: parentId,
          track: u.metadata,
          stemCategory: u.category ?? StemCategory.OTHER
        })
        return {
          ...u,
          metadata
        }
      })
      const trackIds = yield* call(handleUploads, {
        tracks: stemTracks,
        kind: 'stems'
      })

      yield* put(stemUploadsSucceeded({ parentId, batchUID }))

      if (trackIds) {
        for (let i = 0; i < trackIds.length; i += 1) {
          const trackId = trackIds[i]
          const category = stemTracks[i].metadata.stem_of?.category
          const recordEvent = make(Name.STEM_COMPLETE_UPLOAD, {
            id: trackId,
            parent_track_id: parentId,
            category
          })
          yield* put(recordEvent)
        }
      }

      // Retrieve the parent track to refresh stems
      yield* call(retrieveTracks, {
        trackIds: [parentId],
        withStems: true
      })
    }
  )
}

const sagas = () => {
  return [watchUploadStems]
}

export default sagas
