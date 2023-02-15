import RNFetchBlob from 'rn-fetch-blob'
import { takeEvery, select, call } from 'typed-redux-saga'

import { make, track } from 'app/services/analytics'
import {
  getLocalCollectionDir,
  getLocalTrackDir
} from 'app/services/offline-downloader'
import { EventNames } from 'app/types/analytics'

import {
  getOfflineCollectionsStatus,
  getOfflineTrackStatus
} from '../selectors'
import type { RemoveOfflineEntriesAction } from '../slice'
import { removeOfflineItems } from '../slice'

export function* watchRemoveOfflineItems() {
  yield* takeEvery(removeOfflineItems.type, deleteItemsFromDisk)
}

function* deleteItemsFromDisk(action: RemoveOfflineEntriesAction) {
  const { items } = action.payload
  const trackStatus = yield* select(getOfflineTrackStatus)
  const collectionStatus = yield* select(getOfflineCollectionsStatus)

  for (const item of items) {
    track(make({ eventName: EventNames.OFFLINE_MODE_REMOVE_ITEM, ...item }))
    if (item.type === 'collection' && !collectionStatus[item.id]) {
      const collectionDirectory = yield* call(
        getLocalCollectionDir,
        item.id.toString()
      )
      const exists = yield* call(RNFetchBlob.fs.exists, collectionDirectory)
      if (exists) {
        yield* call(RNFetchBlob.fs.unlink, collectionDirectory)
      }
    } else if (item.type === 'track' && !trackStatus[item.id]) {
      const trackDirectory = yield* call(getLocalTrackDir, item.id.toString())
      const exists = yield* call(RNFetchBlob.fs.exists, trackDirectory)
      if (exists) {
        yield* call(RNFetchBlob.fs.unlink, trackDirectory)
      }
    }
  }
}
