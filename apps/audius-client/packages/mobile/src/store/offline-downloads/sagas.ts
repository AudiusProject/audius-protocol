import { clearOfflineDownloadsSaga } from './sagas/clearOfflineDownloadsSaga'
import { processDownloadQueueSaga } from './sagas/processDownloadQueueSaga/processDownloadQueueSaga'
import { rehydrateOfflineDataSaga } from './sagas/rehydrateOfflineDataSaga'
import { requestDownloadAllFavoritesSaga } from './sagas/requestDownloadAllFavoritesSaga'
import { requestDownloadCollectionSaga } from './sagas/requestDownloadCollectionSaga'
import { requestDownloadFavoritedCollectionSaga } from './sagas/requestDownloadFavoritedCollectionSaga'
import { requestRemoveAllDownloadedFavoritesSaga } from './sagas/requestRemoveAllDownloadedFavoritesSaga'
import { requestRemoveDownloadedCollectionSaga } from './sagas/requestRemoveDownloadedCollectionSaga'
import { requestRemoveFavoritedDownloadedCollectionSaga } from './sagas/requestRemoveFavoritedDownloadedCollectionSaga'
import { updateStaleOfflineDataSaga } from './sagas/updateStaleOfflineDataSaga'
import { watchAddOfflineItems } from './sagas/watchAddOfflineItems'
import { watchAddTrackToPlaylistSaga } from './sagas/watchAddTrackToPlaylistSaga'
import { watchReachability } from './sagas/watchReachability'
import { watchRemoveOfflineItems } from './sagas/watchRemoveOfflineItems'
import { watchSaveCollectionSaga } from './sagas/watchSaveCollectionSaga'
import { watchSaveTrackSaga } from './sagas/watchSaveTrackSaga'
import { watchUnSaveTrackSaga } from './sagas/watchUnsaveTrackSaga'

const sagas = () => {
  return [
    // Loading/updating downloaded content
    rehydrateOfflineDataSaga,
    updateStaleOfflineDataSaga,

    // User actions
    requestDownloadAllFavoritesSaga,
    requestDownloadCollectionSaga,
    requestDownloadFavoritedCollectionSaga,
    requestRemoveAllDownloadedFavoritesSaga,
    requestRemoveDownloadedCollectionSaga,
    requestRemoveFavoritedDownloadedCollectionSaga,

    // Queue process
    processDownloadQueueSaga,

    // Watchers
    watchSaveTrackSaga,
    watchUnSaveTrackSaga,
    watchSaveCollectionSaga,
    watchAddOfflineItems,
    watchRemoveOfflineItems,
    watchAddTrackToPlaylistSaga,
    watchReachability,

    // Cleanup
    clearOfflineDownloadsSaga
  ]
}

export default sagas
