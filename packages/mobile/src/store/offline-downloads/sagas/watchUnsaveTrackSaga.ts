import { tracksSocialActions } from '@audius/common'
import { put, takeEvery } from 'typed-redux-saga'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'

import { removeOfflineItems } from '../slice'

export function* watchUnSaveTrackSaga() {
  yield* takeEvery(tracksSocialActions.UNSAVE_TRACK, removeSavedTrack)
}

function* removeSavedTrack(
  action: ReturnType<typeof tracksSocialActions.saveTrack>
) {
  const { trackId } = action
  yield* put(
    removeOfflineItems({
      items: [
        {
          type: 'track',
          id: trackId,
          metadata: {
            reasons_for_download: [
              {
                is_from_favorites: true,
                collection_id: DOWNLOAD_REASON_FAVORITES
              }
            ]
          }
        }
      ]
    })
  )
}
