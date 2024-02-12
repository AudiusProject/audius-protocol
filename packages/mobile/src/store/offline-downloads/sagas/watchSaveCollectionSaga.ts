import { FavoriteSource } from '@audius/common/models'
import { collectionsSocialActions } from '@audius/common/store'
import { takeEvery, select, put } from 'typed-redux-saga'

import { make, track } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import { getIsFavoritesDownloadsEnabled } from '../selectors'
import { requestDownloadFavoritedCollection } from '../slice'

const { saveCollection, SAVE_COLLECTION } = collectionsSocialActions

export function* watchSaveCollectionSaga() {
  yield* takeEvery(SAVE_COLLECTION, checkIfShouldDownload)
}

function* checkIfShouldDownload(action: ReturnType<typeof saveCollection>) {
  const { collectionId, source } = action
  const isFavoritesDownloadEnabled = yield* select(
    getIsFavoritesDownloadsEnabled
  )
  if (
    isFavoritesDownloadEnabled &&
    source !== FavoriteSource.OFFLINE_DOWNLOAD
  ) {
    track(
      make({
        eventName: EventNames.OFFLINE_MODE_DOWNLOAD_REQUEST,
        type: 'collection',
        id: collectionId
      })
    )
    yield* put(requestDownloadFavoritedCollection({ collectionId }))
  }
}
