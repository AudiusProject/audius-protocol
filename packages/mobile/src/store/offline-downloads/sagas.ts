import { clearOfflineDownloadsSaga } from './sagas/clearOfflineDownloadsSaga'
import { downloadQueueSagas } from './sagas/downloadQueueSagas/downloadQueueSagas'
import { rehydrateOfflineDataSaga } from './sagas/rehydrateOfflineDataSaga'
import { requestDownloadAllFavoritesSaga } from './sagas/requestDownloadAllFavoritesSaga'
import { requestDownloadCollectionSaga } from './sagas/requestDownloadCollectionSaga'
import { requestDownloadFavoritedCollectionSaga } from './sagas/requestDownloadFavoritedCollectionSaga'
import { requestRemoveAllDownloadedFavoritesSaga } from './sagas/requestRemoveAllDownloadedFavoritesSaga'
import { requestRemoveDownloadedCollectionSaga } from './sagas/requestRemoveDownloadedCollectionSaga'
import { requestRemoveFavoritedDownloadedCollectionSaga } from './sagas/requestRemoveFavoritedDownloadedCollectionSaga'
import { syncOfflineDataSaga } from './sagas/syncOfflineDataSaga'
import { updateStaleOfflineDataSaga } from './sagas/updateStaleOfflineDataSaga'
import { watchAddTrackToPlaylistSaga } from './sagas/watchAddTrackToPlaylistSaga'
import { watchRemoveOfflineItems } from './sagas/watchRemoveOfflineItems'
import { watchSaveCollectionSaga } from './sagas/watchSaveCollectionSaga'
import { watchSaveTrackSaga } from './sagas/watchSaveTrackSaga'
import { watchUnSaveTrackSaga } from './sagas/watchUnsaveTrackSaga'

const sagas = () => {
  return [
    // Loading/syncing/updating offline content
    rehydrateOfflineDataSaga,
    syncOfflineDataSaga,
    updateStaleOfflineDataSaga,

    // User actions
    requestDownloadAllFavoritesSaga,
    requestDownloadCollectionSaga,
    requestDownloadFavoritedCollectionSaga,
    requestRemoveAllDownloadedFavoritesSaga,
    requestRemoveDownloadedCollectionSaga,
    requestRemoveFavoritedDownloadedCollectionSaga,

    // Queue sagas
    ...downloadQueueSagas(),

    // Track/Collection watchers
    watchSaveTrackSaga,
    watchUnSaveTrackSaga,
    watchSaveCollectionSaga,
    watchRemoveOfflineItems,
    watchAddTrackToPlaylistSaga,

    // Cleanup
    clearOfflineDownloadsSaga
  ]
}

export default sagas
