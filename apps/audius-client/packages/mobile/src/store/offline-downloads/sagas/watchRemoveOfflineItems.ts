import RNFetchBlob from 'rn-fetch-blob'
import { takeEvery, select, call } from 'typed-redux-saga'

import {
  getLocalCollectionDir,
  getLocalTrackDir
} from 'app/services/offline-downloader'

import {
  getOfflineCollectionsStatus,
  getOfflineTrackStatus
} from '../selectors'
import type { RemoveOfflineItemsAction } from '../slice'
import { removeOfflineItems } from '../slice'

export function* watchRemoveOfflineItems() {
  yield* takeEvery(removeOfflineItems.type, deleteItemsFromDisk)
}

function* deleteItemsFromDisk(action: RemoveOfflineItemsAction) {
  const { items } = action.payload
  const trackStatus = yield* select(getOfflineTrackStatus)
  const collectionStatus = yield* select(getOfflineCollectionsStatus)

  for (const item of items) {
    if (item.type === 'collection' && !collectionStatus[item.id]) {
      const collectionDirectory = yield* call(
        getLocalCollectionDir,
        item.id.toString()
      )
      yield* call(RNFetchBlob.fs.unlink, collectionDirectory)
    } else if (item.type === 'track' && !trackStatus[item.id]) {
      const trackDirectory = yield* call(getLocalTrackDir, item.id.toString())
      yield* call(RNFetchBlob.fs.unlink, trackDirectory)
    }
  }
}
