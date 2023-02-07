import { collectionsSocialActions, FavoriteSource } from '@audius/common'
import { takeEvery, select, put } from 'typed-redux-saga'

import { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'

import { getOfflineCollectionsStatus } from '../selectors'
import { requestDownloadFavoritedCollection } from '../slice'

const { saveCollection, SAVE_COLLECTION } = collectionsSocialActions

export function* watchSaveCollectionSaga() {
  yield* takeEvery(SAVE_COLLECTION, checkIfShouldDownload)
}

function* checkIfShouldDownload(action: ReturnType<typeof saveCollection>) {
  const { collectionId, source } = action
  const offlineCollectionStatus = yield* select(getOfflineCollectionsStatus)
  const isFavoritesDownloadEnabled =
    offlineCollectionStatus[DOWNLOAD_REASON_FAVORITES]

  if (
    isFavoritesDownloadEnabled &&
    source !== FavoriteSource.OFFLINE_DOWNLOAD
  ) {
    yield* put(requestDownloadFavoritedCollection({ collectionId }))
  }
}
