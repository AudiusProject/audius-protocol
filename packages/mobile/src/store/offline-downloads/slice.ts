import type {
  OfflineCollectionMetadata,
  ID,
  OfflineTrackMetadata
} from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'

import type { DOWNLOAD_REASON_FAVORITES } from './constants'
import {
  addOfflineCollection,
  addOfflineTrack,
  removeOfflineCollection,
  removeOfflineTrack
} from './utils'

export type CollectionId = ID | typeof DOWNLOAD_REASON_FAVORITES

export type TrackOfflineMetadataPayload = {
  trackId: ID
  offlineMetadata: OfflineTrackMetadata
}

export type DownloadQueueItem =
  | { type: 'collection'; id: CollectionId }
  | { type: 'track'; id: ID }
  | { type: 'collection-sync'; id: CollectionId }
  | { type: 'play-count'; id: ID }
  | { type: 'stale-track'; id: ID }

export type OfflineDownloadsState = {
  trackStatus: {
    [key: string]: OfflineDownloadStatus
  }
  collectionStatus: {
    [key: string]: OfflineDownloadStatus
  }
  collectionSyncStatus: {
    [Key in ID]?: CollectionSyncStatus
  }
  isDoneLoadingFromDisk: boolean
  downloadQueue: DownloadQueueItem[]
  queueStatus: QueueStatus
  offlineTrackMetadata: Record<ID, OfflineTrackMetadata>
  offlineCollectionMetadata: {
    [Key in CollectionId]?: OfflineCollectionMetadata
  }
}

export type RequestRemoveDownloadedCollectionAction = PayloadAction<{
  collectionId: ID
}>

export type RequestRemoveFavoritedDownloadedCollectionAction = PayloadAction<{
  collectionId: ID
}>

export type OfflineItem =
  | { type: 'track'; id: ID; metadata: OfflineTrackMetadata }
  | {
      type: 'collection'
      id: CollectionId
      metadata: OfflineCollectionMetadata
    }
  | {
      type: 'collection-sync'
      id: CollectionId
    }
  | { type: 'play-count'; id: ID }
  | { type: 'stale-track'; id: ID }

export type RedownloadOfflineItemsAction = PayloadAction<{
  items: DownloadQueueItem[]
}>

export type AddOfflineItemsAction = PayloadAction<{
  items: OfflineItem[]
}>

export type RemoveOfflineItemsAction = PayloadAction<{
  items: OfflineItem[]
}>

export type CollectionSyncItem = { id: CollectionId }

export type CollectionAction = PayloadAction<{
  collectionId: ID
}>

export type QueueAction = PayloadAction<DownloadQueueItem>

export type SyncAction = PayloadAction<{ id: CollectionId }>

export type CompleteDownloadAction = PayloadAction<
  | { type: 'track'; id: ID; completedAt: number }
  | { type: 'collection'; id: CollectionId }
  | { type: 'stale-track'; id: ID; verifiedAt: number }
>

export enum QueueStatus {
  IDLE = 'IDLE',
  PAUSED = 'PAUSED',
  PROCESSING = 'PROCESSING'
}

export type UpdateQueueStatusAction = PayloadAction<{
  queueStatus: QueueStatus
}>

export enum OfflineDownloadStatus {
  // download is not initiated
  INACTIVE = 'INACTIVE',
  // download is queued
  INIT = 'INIT',
  // download is in progress
  LOADING = 'LOADING',
  // download succeeded
  SUCCESS = 'SUCCESS',
  // download errored
  ERROR = 'ERROR',
  // download was abandoned (usually after error).
  // downloads in the error state can be retried
  ABANDONED = 'ABANDONED'
}

export enum CollectionSyncStatus {
  INIT = 'INIT',
  SYNCING = 'SYNCING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

const initialState: OfflineDownloadsState = {
  trackStatus: {},
  collectionStatus: {},
  collectionSyncStatus: {},
  isDoneLoadingFromDisk: false,
  downloadQueue: [],
  queueStatus: QueueStatus.IDLE,
  offlineCollectionMetadata: {},
  offlineTrackMetadata: {}
}

const slice = createSlice({
  name: 'offlineDownloads',
  initialState,
  reducers: {
    redownloadOfflineItems: (state, action: RedownloadOfflineItemsAction) => {
      const { trackStatus, collectionStatus, downloadQueue } = state
      const { items } = action.payload

      for (const item of items) {
        const { type, id } = item

        if (type === 'collection') {
          collectionStatus[id] = OfflineDownloadStatus.INIT
        } else if (type === 'track') {
          trackStatus[id] = OfflineDownloadStatus.INIT
        }
        downloadQueue.push(item)
      }
    },
    addOfflineItems: (state, action: AddOfflineItemsAction) => {
      const { items } = action.payload
      const {
        offlineTrackMetadata,
        trackStatus,
        downloadQueue,
        offlineCollectionMetadata,
        collectionStatus,
        collectionSyncStatus
      } = state
      for (const item of items) {
        if (item.type === 'track') {
          const { type, id, metadata } = item
          addOfflineTrack(offlineTrackMetadata, id, metadata)

          if (!trackStatus[id]) {
            trackStatus[id] = OfflineDownloadStatus.INIT
            downloadQueue.push({ type, id })
          }
        } else if (item.type === 'collection') {
          const { type, id, metadata } = item
          addOfflineCollection(offlineCollectionMetadata, id, metadata)

          if (!collectionStatus[id]) {
            collectionStatus[id] = OfflineDownloadStatus.INIT
            downloadQueue.push({ type, id })
          }
        } else if (item.type === 'collection-sync') {
          const { id } = item
          const syncStatus = collectionSyncStatus[id]
          if (
            !(
              syncStatus === CollectionSyncStatus.INIT ||
              syncStatus === CollectionSyncStatus.SYNCING
            )
          ) {
            collectionSyncStatus[id] = CollectionSyncStatus.INIT
            downloadQueue.push({ type: 'collection-sync', id })
          }
        } else if (item.type === 'play-count') {
          downloadQueue.push(item)
        } else if (item.type === 'stale-track') {
          const { id } = item
          const trackMetadata = offlineTrackMetadata[id]
          if (trackMetadata) {
            trackMetadata.last_verified_time = Date.now()
          }
          downloadQueue.push({ type: 'stale-track', id })
        }
      }
    },
    removeOfflineItems: (state, action: RemoveOfflineItemsAction) => {
      const { items } = action.payload
      const {
        offlineTrackMetadata,
        trackStatus,
        downloadQueue,
        offlineCollectionMetadata,
        collectionStatus,
        collectionSyncStatus
      } = state

      for (const item of items) {
        if (item.type === 'track') {
          const { type, id, metadata } = item
          removeOfflineTrack(offlineTrackMetadata, id, metadata)

          if (!offlineTrackMetadata[id]) {
            delete trackStatus[id]
            const trackIndex = downloadQueue.findIndex(
              (queueItem) => queueItem.type === type && queueItem.id === id
            )
            if (trackIndex !== -1) downloadQueue.splice(trackIndex, 1)

            const staleTrackIndex = downloadQueue.findIndex(
              (queueItem) =>
                queueItem.type === 'stale-track' && queueItem.id === id
            )
            if (staleTrackIndex !== -1) downloadQueue.splice(staleTrackIndex, 1)
          }
        } else if (item.type === 'collection') {
          const { id, metadata } = item
          removeOfflineCollection(offlineCollectionMetadata, id, metadata)

          if (!offlineCollectionMetadata[id]) {
            delete collectionStatus[id]
            delete collectionSyncStatus[id]

            const collectionIndex = downloadQueue.findIndex(
              (queueItem) =>
                queueItem.type === 'collection' && queueItem.id === id
            )
            if (collectionIndex !== -1) downloadQueue.splice(collectionIndex, 1)

            const collectionSyncIndex = downloadQueue.findIndex(
              (queueItem) =>
                queueItem.type === 'collection-sync' && queueItem.id === id
            )
            if (collectionSyncIndex !== -1)
              downloadQueue.splice(collectionSyncIndex, 1)
          }
        }
      }
    },
    startDownload: (state, action: QueueAction) => {
      const { type, id } = action.payload
      if (type === 'collection') {
        state.collectionStatus[id] = OfflineDownloadStatus.LOADING
      } else if (type === 'track') {
        state.trackStatus[id] = OfflineDownloadStatus.LOADING
      } else if (type === 'stale-track') {
        // continue
      }
    },
    completeDownload: (state, action: CompleteDownloadAction) => {
      const { type, id } = action.payload
      if (type === 'collection') {
        state.collectionStatus[id] = OfflineDownloadStatus.SUCCESS
      } else if (type === 'track') {
        const { completedAt } = action.payload
        state.trackStatus[id] = OfflineDownloadStatus.SUCCESS
        const trackMetadata = state.offlineTrackMetadata[id]
        if (trackMetadata) {
          trackMetadata.last_verified_time = completedAt
          trackMetadata.download_completed_time = completedAt
        }
      } else if (type === 'stale-track') {
        const { verifiedAt } = action.payload
        const trackMetadata = state.offlineTrackMetadata[id]
        if (trackMetadata) {
          trackMetadata.last_verified_time = verifiedAt
        }
      }

      state.downloadQueue.shift()
    },
    cancelDownload: (state, action: QueueAction) => {
      const { type, id } = action.payload
      if (type === 'collection') {
        state.collectionStatus[id] = OfflineDownloadStatus.INIT
      } else if (type === 'track') {
        state.trackStatus[id] = OfflineDownloadStatus.INIT
      }
    },
    errorDownload: (state, action: QueueAction) => {
      const { type, id } = action.payload
      if (type === 'collection') {
        state.collectionStatus[id] = OfflineDownloadStatus.ERROR
      } else if (type === 'track') {
        state.trackStatus[id] = OfflineDownloadStatus.ERROR
      } else if (type === 'stale-track') {
        // continue
      }
      state.downloadQueue.shift()
    },
    abandonDownload: (state, action: QueueAction) => {
      const { type, id } = action.payload
      if (type === 'collection') {
        state.collectionStatus[id] = OfflineDownloadStatus.ABANDONED
      } else if (type === 'track') {
        state.trackStatus[id] = OfflineDownloadStatus.ABANDONED
      } else if (type === 'stale-track') {
        state.trackStatus[id] = OfflineDownloadStatus.ABANDONED
      }
      state.downloadQueue.shift()
    },
    startCollectionSync: (state, action: SyncAction) => {
      const { id } = action.payload
      state.collectionSyncStatus[id] = CollectionSyncStatus.SYNCING
    },
    completeCollectionSync: (state, action: SyncAction) => {
      const { id } = action.payload
      state.collectionSyncStatus[id] = CollectionSyncStatus.SUCCESS
      state.downloadQueue.shift()
    },
    cancelCollectionSync: (state, action: SyncAction) => {
      const { id } = action.payload
      state.collectionSyncStatus[id] = CollectionSyncStatus.INIT
    },
    errorCollectionSync: (state, action: SyncAction) => {
      const { id } = action.payload
      state.collectionSyncStatus[id] = CollectionSyncStatus.ERROR
      state.downloadQueue.shift()
    },
    completePlayCount: (state) => {
      state.downloadQueue.shift()
    },
    updateQueueStatus: (state, action: UpdateQueueStatusAction) => {
      state.queueStatus = action.payload.queueStatus
    },
    doneLoadingFromDisk: (state) => {
      state.isDoneLoadingFromDisk = true
    },
    clearOfflineDownloads: (state) => {
      state.trackStatus = initialState.trackStatus
      state.collectionStatus = initialState.collectionStatus
      state.collectionSyncStatus = initialState.collectionSyncStatus
      state.offlineTrackMetadata = initialState.offlineTrackMetadata
      state.trackStatus = initialState.trackStatus
      state.isDoneLoadingFromDisk = initialState.isDoneLoadingFromDisk
      state.downloadQueue = initialState.downloadQueue
      state.queueStatus = initialState.queueStatus
      state.offlineTrackMetadata = initialState.offlineTrackMetadata
      state.offlineCollectionMetadata = initialState.offlineCollectionMetadata
    },
    // Lifecycle actions that trigger complex saga flows
    requestDownloadAllFavorites: () => {},
    requestRemoveAllDownloadedFavorites: () => {},
    requestDownloadCollection: (_state, _action: CollectionAction) => {},
    requestDownloadFavoritedCollection: (
      _state,
      _action: CollectionAction
    ) => {},
    requestRemoveDownloadedCollection: (
      _state,
      _action: RequestRemoveDownloadedCollectionAction
    ) => {},
    requestDownloadQueuedItem: () => {}
  }
})

export const {
  addOfflineItems,
  removeOfflineItems,
  redownloadOfflineItems,
  doneLoadingFromDisk,
  clearOfflineDownloads,
  startDownload,
  completeDownload,
  cancelDownload,
  errorDownload,
  abandonDownload,
  startCollectionSync,
  completeCollectionSync,
  cancelCollectionSync,
  errorCollectionSync,
  completePlayCount,
  updateQueueStatus,
  requestDownloadAllFavorites,
  requestDownloadCollection,
  requestDownloadFavoritedCollection,
  requestRemoveAllDownloadedFavorites,
  requestRemoveDownloadedCollection,
  requestDownloadQueuedItem
} = slice.actions
export const actions = slice.actions

const offlineDownloadsPersistConfig = {
  key: 'offline-downloads',
  storage: AsyncStorage,
  blacklist: ['isDoneLoadingFromDisk', 'queueStatus']
}

const persistedOfflineDownloadsReducer = persistReducer(
  offlineDownloadsPersistConfig,
  slice.reducer
)

export default persistedOfflineDownloadsReducer
