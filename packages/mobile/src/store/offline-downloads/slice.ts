import type {
  ID,
  OfflineCollectionMetadata,
  OfflineTrackMetadata
} from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import { persistReducer } from 'redux-persist'

import type { DOWNLOAD_REASON_FAVORITES } from 'app/services/offline-downloader'

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

export type OfflineDownloadsState = {
  trackStatus: {
    [key: string]: OfflineDownloadStatus
  }
  collectionStatus: {
    [key: string]: OfflineDownloadStatus
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

export type AddOfflineItemsAction = PayloadAction<{
  items: OfflineItem[]
}>

export type RemoveOfflineItemsAction = PayloadAction<{
  items: OfflineItem[]
}>

export type CollectionAction = PayloadAction<{
  collectionId: ID
}>

export type QueueAction = PayloadAction<DownloadQueueItem>

export type CompleteDownloadAction = PayloadAction<
  | { type: 'track'; id: ID; completedAt: number }
  | { type: 'collection'; id: CollectionId }
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

const initialState: OfflineDownloadsState = {
  trackStatus: {},
  collectionStatus: {},
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
    addOfflineItems: (state, action: AddOfflineItemsAction) => {
      const { items } = action.payload
      const {
        offlineTrackMetadata,
        trackStatus,
        downloadQueue,
        offlineCollectionMetadata,
        collectionStatus
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
        collectionStatus
      } = state

      for (const item of items) {
        if (item.type === 'track') {
          const { type, id, metadata } = item
          removeOfflineTrack(offlineTrackMetadata, id, metadata)

          if (!offlineTrackMetadata[id]) {
            delete trackStatus[id]
            const queueIndex = downloadQueue.findIndex(
              (queueItem) => queueItem.type === type && queueItem.id === id
            )
            downloadQueue.splice(queueIndex, 1)
          }
        } else if (item.type === 'collection') {
          const { type, id, metadata } = item
          removeOfflineCollection(offlineCollectionMetadata, id, metadata)

          if (!offlineCollectionMetadata[id]) {
            delete collectionStatus[id]
            const queueIndex = downloadQueue.findIndex(
              (queueItem) => queueItem.type === type && queueItem.id === id
            )
            downloadQueue.splice(queueIndex, 1)
          }
        }
      }
    },
    downloadQueuedItem: () => {},
    startDownload: (state, action: QueueAction) => {
      const { type, id } = action.payload
      if (type === 'collection') {
        state.collectionStatus[id] = OfflineDownloadStatus.LOADING
      } else if (type === 'track') {
        state.trackStatus[id] = OfflineDownloadStatus.LOADING
      }
    },
    completeDownload: (state, action: CompleteDownloadAction) => {
      const item = action.payload
      if (item.type === 'collection') {
        state.collectionStatus[item.id] = OfflineDownloadStatus.SUCCESS
      } else if (item.type === 'track') {
        const { id, completedAt } = item
        state.trackStatus[id] = OfflineDownloadStatus.SUCCESS
        const trackMetadata = state.offlineTrackMetadata[id]
        trackMetadata.last_verified_time = completedAt
        trackMetadata.download_completed_time = completedAt
      }
      state.downloadQueue.shift()
    },
    errorDownload: (state, action: QueueAction) => {
      const { type, id } = action.payload
      if (type === 'collection') {
        state.collectionStatus[id] = OfflineDownloadStatus.ERROR
      } else if (type === 'track') {
        state.trackStatus[id] = OfflineDownloadStatus.ERROR
      }
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
    requestDownloadCollection: (_state, _action: CollectionAction) => {},
    requestDownloadFavoritedCollection: (
      _state,
      _action: CollectionAction
    ) => {},
    removeAllDownloadedFavorites: () => {},
    requestRemoveDownloadedCollection: (
      _state,
      _action: RequestRemoveDownloadedCollectionAction
    ) => {},
    requestRemoveFavoritedDownloadedCollection: (
      _state,
      _action: RequestRemoveDownloadedCollectionAction
    ) => {}
  }
})

export const {
  addOfflineItems,
  removeOfflineItems,
  doneLoadingFromDisk,
  clearOfflineDownloads,
  requestDownloadAllFavorites,
  requestDownloadCollection,
  requestDownloadFavoritedCollection,
  removeAllDownloadedFavorites,
  requestRemoveDownloadedCollection,
  requestRemoveFavoritedDownloadedCollection,
  downloadQueuedItem,
  startDownload,
  completeDownload,
  errorDownload,
  updateQueueStatus
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
