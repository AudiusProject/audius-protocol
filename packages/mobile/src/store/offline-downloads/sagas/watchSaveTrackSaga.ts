import { tracksSocialActions } from '@audius/common'
import moment from 'moment'
import { put, takeEvery, select } from 'typed-redux-saga'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'

import { getIsCollectionMarkedForDownload } from '../selectors'
import { addOfflineItems } from '../slice'

export function* watchSaveTrackSaga() {
  yield* takeEvery(tracksSocialActions.SAVE_TRACK, downloadSavedTrack)
}

function* downloadSavedTrack(
  action: ReturnType<typeof tracksSocialActions.saveTrack>
) {
  const { trackId } = action
  const isAllFavoritesDownloadOn = yield* select(
    getIsCollectionMarkedForDownload(DOWNLOAD_REASON_FAVORITES)
  )

  if (!isAllFavoritesDownloadOn) return
  yield* put(
    addOfflineItems({
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
