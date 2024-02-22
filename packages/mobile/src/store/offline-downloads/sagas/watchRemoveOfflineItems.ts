import ReactNativeBlobUtil from 'react-native-blob-util'
import { takeEvery, select, call, all } from 'typed-redux-saga'

import {
  getLocalCollectionDir,
  getLocalTrackDir
} from 'app/services/offline-downloader'

import {
  getOfflineCollectionsStatus,
  getOfflineTrackStatus
} from '../selectors'
import type {
  CollectionStatus,
  OfflineEntry,
  RemoveOfflineEntriesAction,
  TrackStatus
} from '../slice'
import { removeOfflineItems } from '../slice'

export function* watchRemoveOfflineItems() {
  yield* takeEvery(removeOfflineItems.type, deleteItemsFromDisk)
}

function* deleteItemsFromDisk(action: RemoveOfflineEntriesAction) {
  const { items } = action.payload
  const trackStatus = yield* select(getOfflineTrackStatus)
  const collectionStatus = yield* select(getOfflineCollectionsStatus)

  yield* all(
    items.map((item) =>
      call(removeItemFromDisk, item, trackStatus, collectionStatus)
    )
  )
}

function* removeItemFromDisk(
  item: OfflineEntry,
  trackStatus: TrackStatus,
  collectionStatus: CollectionStatus
) {
  if (item.type === 'collection' && !collectionStatus[item.id]) {
    const collectionDirectory = yield* call(
      getLocalCollectionDir,
      item.id.toString()
    )
    const exists = yield* call(
      ReactNativeBlobUtil.fs.exists,
      collectionDirectory
    )
    if (exists) {
      yield* call(ReactNativeBlobUtil.fs.unlink, collectionDirectory)
    }
  } else if (item.type === 'track' && !trackStatus[item.id]) {
    const trackDirectory = yield* call(getLocalTrackDir, item.id.toString())
    const exists = yield* call(ReactNativeBlobUtil.fs.exists, trackDirectory)
    if (exists) {
      yield* call(ReactNativeBlobUtil.fs.unlink, trackDirectory)
    }
  }
}
