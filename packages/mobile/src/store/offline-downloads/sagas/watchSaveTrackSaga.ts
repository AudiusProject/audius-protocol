import { tracksSocialActions } from '@audius/common/store'
import moment from 'moment'
import { put, takeEvery, select } from 'typed-redux-saga'

import { make, track } from 'app/services/analytics'
import { DOWNLOAD_REASON_FAVORITES } from 'app/store/offline-downloads/constants'
import { EventNames } from 'app/types/analytics'

import { getIsFavoritesDownloadsEnabled } from '../selectors'
import { addOfflineEntries } from '../slice'

export function* watchSaveTrackSaga() {
  yield* takeEvery(tracksSocialActions.SAVE_TRACK, downloadSavedTrack)
}

function* downloadSavedTrack(
  action: ReturnType<typeof tracksSocialActions.saveTrack>
) {
  const { trackId } = action
  const isFavoritesDownloadEnabled = yield* select(
    getIsFavoritesDownloadsEnabled
  )

  if (isFavoritesDownloadEnabled) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_REQUEST,
        type: 'track',
        id: trackId
      })
    )
    yield* put(
      addOfflineEntries({
        items: [
          {
            type: 'track',
            id: trackId,
            metadata: {
              favorite_created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
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
}
