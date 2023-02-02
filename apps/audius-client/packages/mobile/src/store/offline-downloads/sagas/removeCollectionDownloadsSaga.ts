import RNFetchBlob from 'rn-fetch-blob'
import { takeEvery, call } from 'typed-redux-saga'

import { getLocalCollectionDir } from 'app/services/offline-downloader'

import type { RemoveCollectionDownloadsAction } from '../slice'
import { removeCollectionDownloads } from '../slice'

export function* watchRemoveCollectionDownloads() {
  yield* takeEvery(removeCollectionDownloads.type, removeCollectionsFromDisk)
}

function* removeCollectionsFromDisk(action: RemoveCollectionDownloadsAction) {
  const { collectionIds } = action.payload
  for (const collectionId of collectionIds) {
    const collectionDirectory = yield* call(
      getLocalCollectionDir,
      collectionId.toString()
    )

    yield* call(RNFetchBlob.fs.unlink, collectionDirectory)
  }
}
