import { tracksSocialActions } from '@audius/common/store'
import { put, takeEvery } from 'typed-redux-saga'

import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants'

import { removeOfflineItems } from '../slice'

export function* watchUnsaveTrackSaga() {
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
